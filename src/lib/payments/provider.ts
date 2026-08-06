import { randomBytes } from "node:crypto";
import type { PaymentMethod } from "@prisma/client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const CINETPAY_BASE =
  process.env.CINETPAY_BASE_URL ?? "https://api-checkout.cinetpay.com/v2";

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

function confirmationUrl(metadata: Record<string, unknown>): string {
  const paymentId =
    typeof metadata.paymentId === "string" ? metadata.paymentId : "";
  return `${SITE_URL}/compte/paiement/${paymentId}`;
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
  const paymentUrl = `${confirmationUrl(input.metadata)}?tx=${providerTxId}`;
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
      return_url: confirmationUrl(input.metadata),
      channels: methodMap[input.method] ?? "OM",
      lang: "fr",
      metadata: input.metadata,
    }),
  });

  const data = (await response.json().catch(() => null)) as {
    code?: string;
    message?: string;
    data?: { payment_url?: string; payment_token?: string; cpm_trans_id?: string };
  } | null;

  if (!response.ok || data?.code !== "201" || !data?.data?.payment_url) {
    throw new Error(
      `CinetPay : ${data?.message ?? "échec de l'initialisation"}`,
    );
  }

  return {
    providerTxId: data.data.payment_token ?? data.data.cpm_trans_id ?? input.reference,
    paymentUrl: data.data.payment_url,
    success: true,
  };
}
