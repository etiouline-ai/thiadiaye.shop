import { prisma } from "@/lib/db";
import {
  featuredPriceFCFA,
  FEATURED_MAX_DAYS,
  FEATURED_MIN_DAYS,
} from "@/lib/payments/pricing";
import { initiatePayment, getProvider } from "@/lib/payments/provider";
import type { PaymentMethod } from "@prisma/client";

export async function createFeaturedPayment(params: {
  userId: string;
  listingId: string;
  method: PaymentMethod;
  days: number;
}) {
  const { userId, listingId, method, days } = params;

  if (days < FEATURED_MIN_DAYS || days > FEATURED_MAX_DAYS) {
    throw new Error("Durée de mise en avant invalide");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, title: true, status: true },
  });
  if (!listing) throw new Error("Annonce introuvable");
  if (listing.sellerId !== userId) {
    throw new Error("Vous n'êtes pas le propriétaire de cette annonce");
  }
  if (listing.status !== "PUBLISHED") {
    throw new Error("L'annonce doit être publiée pour être mise en avant");
  }

  const amount = featuredPriceFCFA(days);
  const reference = `FEAT-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  const payment = await prisma.payment.create({
    data: {
      userId,
      listingId,
      amount,
      currency: "XOF",
      method,
      provider: getProvider() === "cinetpay" ? "CINETPAY" : "MOCK",
      type: "FEATURED_LISTING",
      status: "PENDING",
      metadata: { reference, days, listingTitle: listing.title },
    },
  });

  const initiated = await initiatePayment({
    amount,
    currency: "XOF",
    method,
    description: `Mise en avant ${days} j - ${listing.title}`,
    reference,
    metadata: { paymentId: payment.id, listingId, days },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerTxId: initiated.providerTxId,
      metadata: { reference, days, listingTitle: listing.title, paymentUrl: initiated.paymentUrl },
    },
  });

  return {
    payment,
    providerTxId: initiated.providerTxId,
    paymentUrl: initiated.paymentUrl,
    amount,
  };
}

export async function confirmPaymentSuccess(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new Error("Paiement introuvable");
  if (payment.status === "SUCCESS") return payment;

  const days = (payment.metadata as { days?: number } | null)?.days ?? FEATURED_MIN_DAYS;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "SUCCESS" },
    });

    if (payment.listingId && payment.type === "FEATURED_LISTING") {
      const now = new Date();
      const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      await tx.listing.update({
        where: { id: payment.listingId },
        data: { featuredUntil: until, featuredBy: payment.method },
      });
    }

    return updated;
  });
}

export async function confirmPaymentFailed(paymentId: string) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED" },
  });
}
