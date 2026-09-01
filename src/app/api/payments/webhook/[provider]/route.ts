import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { confirmPaymentSuccess, confirmPaymentFailed } from "@/lib/payments/service";
import {
  checkCinetpayTransaction,
  verifyCinetpayToken,
} from "@/lib/payments/cinetpay";
import { revalidatePath } from "next/cache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (provider === "mock") {
    const body = (await req.json().catch(() => null)) as {
      paymentId?: string;
      status?: string;
    } | null;

    if (!body?.paymentId || !body?.status) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: body.paymentId },
      select: { id: true, provider: true, userId: true, listingId: true, shopId: true },
    });
    if (!payment || payment.provider !== "MOCK" || payment.userId !== session.id) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    if (body.status === "success") {
      await confirmPaymentSuccess(payment.id);
      if (payment.listingId) {
        revalidatePath("/annonces");
        revalidatePath("/");
      }
      if (payment.shopId) {
        revalidatePath("/boutiques");
        revalidatePath("/compte/boutique");
      }
      return NextResponse.json({ success: true });
    }

    await confirmPaymentFailed(payment.id);
    return NextResponse.json({ success: true });
  }

  if (provider === "paytech") {
    return handlePaytech(req);
  }

  if (provider === "cinetpay") {
    return handleCinetpay(req);
  }

  return NextResponse.json({ error: "Fournisseur inconnu" }, { status: 400 });
}

async function handlePaytech(req: NextRequest): Promise<NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";

  let body: Record<string, string>;
  if (contentType.includes("application/json")) {
    const parsed = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!parsed) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    body = Object.fromEntries(
      Object.entries(parsed).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]),
    );
  } else {
    const raw = await req.text();
    body = Object.fromEntries(new URLSearchParams(raw).entries());
  }

  if (!verifyPaytechIpn(body)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const reference = body.ref_command ?? "";
  const token = body.token ?? "";
  if (!reference && !token) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      OR: [
        ...(reference ? [{ metadata: { path: ["reference"], equals: reference } }] : []),
        ...(token ? [{ providerTxId: token }] : []),
      ],
    },
  });

  if (!payment || payment.provider !== "PAYTECH") {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  const typeEvent = body.type_event ?? body.type_ipn ?? "";
  const isSuccess =
    typeEvent === "sale_complete" ||
    (typeEvent === "payment" && body.payment_status === "success");
  const isCanceled =
    typeEvent === "sale_canceled" ||
    (typeEvent === "payment" && body.payment_status === "failed");

  if (isSuccess) {
    const ipnAmount = Number(body.item_price);
    const ipnCurrency = (body.currency ?? "").toUpperCase();
    if (!Number.isNaN(ipnAmount) && ipnAmount > 0 && ipnAmount !== payment.amount) {
      return NextResponse.json({ error: "Montant incohérent" }, { status: 400 });
    }
    if (ipnCurrency && ipnCurrency !== "XOF") {
      return NextResponse.json({ error: "Devise incohérente" }, { status: 400 });
    }
    await confirmPaymentSuccess(payment.id);
    if (payment.listingId) {
      revalidatePath("/annonces");
      revalidatePath("/");
    }
    if (payment.shopId) {
      revalidatePath("/boutiques");
      revalidatePath("/compte/boutique");
    }
  } else if (isCanceled) {
    await confirmPaymentFailed(payment.id);
  }

  return NextResponse.json({ success: true });
}

function verifyPaytechIpn(body: Record<string, string>): boolean {
  const apiKey = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;
  if (!apiKey || !apiSecret) return false;
  const sha = (value: string) => createHash("sha256").update(value).digest("hex");
  return (
    body.api_key_sha256 === sha(apiKey) &&
    body.api_secret_sha256 === sha(apiSecret)
  );
}

async function handleCinetpay(req: NextRequest): Promise<NextResponse> {
  const contentType = req.headers.get("content-type") ?? "";

  let values: string[] = [];
  let fields: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    for (const [k, v] of Object.entries(body)) {
      fields[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
    values = Object.values(fields);
  } else {
    const raw = await req.text();
    const parsed = new URLSearchParams(raw);
    fields = Object.fromEntries(parsed.entries());
    values = [...parsed.values()];
  }

  const secret = process.env.CINETPAY_SECRET_KEY;
  const xToken = req.headers.get("x-token");
  if (secret && !verifyCinetpayToken(xToken, secret, values)) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  const cpmTransId = fields.cpm_trans_id ?? "";
  const transactionId = fields.transaction_id ?? "";
  if (!cpmTransId && !transactionId) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      provider: "CINETPAY",
      OR: [
        ...(cpmTransId ? [{ providerTxId: cpmTransId }] : []),
        ...(transactionId
          ? [
              { providerTxId: transactionId },
              { metadata: { path: ["reference"], equals: transactionId } },
            ]
          : []),
      ],
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  const metadata = (payment.metadata ?? {}) as { reference?: string };
  if (metadata.reference && transactionId && metadata.reference !== transactionId) {
    return NextResponse.json({ error: "Référence incohérente" }, { status: 400 });
  }

  // Autorité : vérification serveur auprès de CinetPay (transaction_id marchand)
  const check = await checkCinetpayTransaction(
    transactionId || metadata.reference || cpmTransId,
  );

  if (check.succeeded) {
    if (check.amount !== undefined && Number(check.amount) !== payment.amount) {
      return NextResponse.json({ error: "Montant incohérent" }, { status: 400 });
    }
    await confirmPaymentSuccess(payment.id);
    if (payment.listingId) {
      revalidatePath("/annonces");
      revalidatePath("/");
    }
    if (payment.shopId) {
      revalidatePath("/boutiques");
      revalidatePath("/compte/boutique");
    }
    return NextResponse.json({ success: true, status: check.status });
  }

  await confirmPaymentFailed(payment.id);
  return NextResponse.json({ success: true, status: check.status || "PENDING" });
}
