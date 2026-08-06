import { randomBytes } from "node:crypto";
import type { PaymentMethod } from "@prisma/client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const CINETPAY_BASE = "https://api-checkout.cinetpay.com/v2";

export interface InitiateInput {
  amount: number;
  currency: string;
  method: PaymentMethod;
  description: string;
  reference: string;
  metadata: Record<string, unknown>;
}

export interface InitiateResult {
  providerTxId: string;
  paymentUrl: string | null;
  success: boolean;
}

export function getProvider(): "mock" | "cinetpay" | "paydunya" {
  const p = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  return p === "cinetpay" ? "cinetpay" : p === "paydunya" ? "paydunya" : "mock";
}

export async function initiatePayment(
  input: InitiateInput,
): Promise<InitiateResult> {
  const provider = getProvider();

  if (provider === "cinetpay") {
    return initiateCinetpay(input);
  }

  // Mock (développement / sans compte marchand)
  const providerTxId = `MOCK-${randomBytes(8).toString("hex").toUpperCase()}`;
  const paymentUrl = `${SITE_URL}/compte/paiement/${input.reference}?tx=${providerTxId}`;
  return { providerTxId, paymentUrl, success: true };
}

async function initiateCinetpay(input: InitiateInput): Promise<InitiateResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) {
    throw new Error(
      "CinetPay n'est pas configuré : renseignez CINETPAY_API_KEY et CINETPAY_SITE_ID dans .env",
    );
  }

  const methodMap: Record<string, string> = {
    ORANGE_MONEY: "OM",
    WAVE: "WAVE",
    FREE_MONEY: "FREEMONEY",
  };

  const response = await fetch(`${CINETPAY_BASE}/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: input.reference,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      notify_url: `${SITE_URL}/api/payments/webhook/cinetpay`,
      return_url: `${SITE_URL}/compte/paiement/${input.reference}`,
      channels: methodMap[input.method] ?? "OM",
      metadata: input.metadata,
    }),
  });

  const data = (await response.json()) as {
    code?: string;
    message?: string;
    data?: { payment_url?: string; payment_token?: string };
  };

  if (!response.ok || data.code !== "201" || !data.data?.payment_token) {
    throw new Error(`CinetPay : ${data.message ?? "échec de l'initialisation"}`);
  }

  return {
    providerTxId: data.data.payment_token,
    paymentUrl: data.data.payment_url ?? null,
    success: true,
  };
}
