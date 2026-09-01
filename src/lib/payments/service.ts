import { prisma } from "@/lib/db";
import {
  featuredPriceFCFA,
  FEATURED_MAX_DAYS,
  FEATURED_MIN_DAYS,
  SHOP_CREATION_PRICE_FCFA,
} from "@/lib/payments/pricing";
import { initiatePayment, paymentProviderEnum } from "@/lib/payments/provider";
import type { PaymentMethod } from "@prisma/client";

export async function createShopPayment(params: {
  userId: string;
  shopId: string;
  method: PaymentMethod;
}) {
  const { userId, shopId, method } = params;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, ownerId: true, name: true, status: true },
  });
  if (!shop) throw new Error("Boutique introuvable");
  if (shop.ownerId !== userId) {
    throw new Error("Vous n'êtes pas le propriétaire de cette boutique");
  }
  if (shop.status === "ACTIVE") {
    throw new Error("Votre boutique est déjà active");
  }

  const amount = SHOP_CREATION_PRICE_FCFA;
  const reference = `SHOP-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  const payment = await prisma.payment.create({
    data: {
      userId,
      shopId,
      amount,
      currency: "XOF",
      method,
      provider: paymentProviderEnum(),
      type: "BUSINESS_PRO",
      status: "PENDING",
      metadata: { reference, shopName: shop.name },
    },
  });

  const initiated = await initiatePayment({
    amount,
    currency: "XOF",
    method,
    description: `Création de boutique - ${shop.name}`,
    reference,
    metadata: { paymentId: payment.id, shopId },
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      providerTxId: initiated.providerTxId,
      metadata: {
        reference,
        shopName: shop.name,
        paymentUrl: initiated.paymentUrl,
      },
    },
  });

  return {
    payment,
    providerTxId: initiated.providerTxId,
    paymentUrl: initiated.paymentUrl,
    amount,
  };
}

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
      provider: paymentProviderEnum(),
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
      const current = await tx.listing.findUnique({
        where: { id: payment.listingId },
        select: { featuredUntil: true },
      });
      const base =
        current?.featuredUntil && current.featuredUntil > now
          ? current.featuredUntil
          : now;
      const until = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      await tx.listing.update({
        where: { id: payment.listingId },
        data: { featuredUntil: until, featuredBy: payment.method },
      });
    }

    if (payment.shopId && payment.type === "BUSINESS_PRO") {
      await tx.shop.update({
        where: { id: payment.shopId },
        data: { status: "ACTIVE" },
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
