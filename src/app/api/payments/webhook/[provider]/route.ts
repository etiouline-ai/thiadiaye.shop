import { NextRequest, NextResponse } from "next/server";
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
      select: { id: true, provider: true, userId: true, listingId: true },
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
      return NextResponse.json({ success: true });
    }

    await confirmPaymentFailed(payment.id);
    return NextResponse.json({ success: true });
  }

  if (provider === "cinetpay") {
    return handleCinetpay(req);
  }

  return NextResponse.json({ error: "Fournisseur inconnu" }, { status: 400 });
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
  const reference = transactionId || cpmTransId;
  if (!reference) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { providerTxId: cpmTransId, provider: "CINETPAY" },
  });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  const metadata = (payment.metadata ?? {}) as { reference?: string };
  if (metadata.reference && metadata.reference !== reference) {
    return NextResponse.json({ error: "Référence incohérente" }, { status: 400 });
  }

  // Autorité : vérification serveur auprès de CinetPay
  const check = await checkCinetpayTransaction(metadata.reference ?? reference);

  if (check.succeeded) {
    if (check.amount !== undefined && Number(check.amount) !== payment.amount) {
      return NextResponse.json({ error: "Montant incohérent" }, { status: 400 });
    }
    await confirmPaymentSuccess(payment.id);
    if (payment.listingId) {
      revalidatePath("/annonces");
      revalidatePath("/");
    }
    return NextResponse.json({ success: true, status: check.status });
  }

  await confirmPaymentFailed(payment.id);
  return NextResponse.json({ success: true, status: check.status || "PENDING" });
}
