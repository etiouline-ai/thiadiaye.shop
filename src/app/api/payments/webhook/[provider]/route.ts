import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { confirmPaymentSuccess, confirmPaymentFailed } from "@/lib/payments/service";
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
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return NextResponse.json({ error: "Corps invalide" }, { status: 400 });

    const cpmTransId = String(body.cpm_trans_id ?? "");
    const payment = await prisma.payment.findFirst({
      where: { providerTxId: cpmTransId },
    });
    if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

    const status = String(body.cpm_result ?? "");
    const succeeded = status === "00";
    if (succeeded) {
      await confirmPaymentSuccess(payment.id);
    } else {
      await confirmPaymentFailed(payment.id);
    }
    return NextResponse.json({ success: true, status });
  }

  return NextResponse.json({ error: "Fournisseur inconnu" }, { status: 400 });
}
