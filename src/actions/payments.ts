"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { featuredPriceSchema } from "@/lib/validations";
import { createFeaturedPayment } from "@/lib/payments/service";

export type PaymentActionResult = {
  error?: string;
  paymentId?: string;
  paymentUrl?: string;
  amount?: number;
};

export async function payForFeatured(input: unknown): Promise<PaymentActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous" };

  const parsed = featuredPriceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await createFeaturedPayment({
      userId: user.id,
      listingId: parsed.data.listingId,
      method: parsed.data.method,
      days: parsed.data.days,
    });
    revalidatePath("/compte");
    return {
      paymentId: result.payment.id,
      paymentUrl: result.paymentUrl ?? undefined,
      amount: result.amount,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
