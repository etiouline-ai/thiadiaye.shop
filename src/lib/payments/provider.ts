import { randomBytes } from "node:crypto";
import type { PaymentMethod, PaymentProvider } from "@prisma/client";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const CINETPAY_BASE =
  process.env.CINETPAY_BASE_URL ?? "https://api-checkout.cinetpay.com/v2";

const PAYTECH_BASE =
  process.env.PAYTECH_BASE_URL ?? "https://paytech.sn/api";

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

export function getProvider(): "mock" | "cinetpay" | "paydunya" | "paytech" {
  const p = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  return p === "cinetpay"
    ? "cinetpay"
    : p === "paydunya"
      ? "paydunya"
      : p === "paytech"
        ? "paytech"
        : "mock";
}

export function paymentProviderEnum(): PaymentProvider {
  const p = getProvider();
  if (p === "cinetpay") return "CINETPAY";
  if (p === "paydunya") return "PAYDUNYA";
  if (p === "paytech") return "PAYTECH";
  return "MOCK";
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

  if (provider === "paytech") {
    return initiatePaytech(input);
  }

  // Mock (développement / sans compte marchand)
  const providerTxId = `MOCK-${randomBytes(8).toString("hex").toUpperCase()}`;
  const paymentUrl = `${confirmationUrl(input.metadata)}?tx=${providerTxId}`;
  return { providerTxId, paymentUrl, success: true };
}

const PAYTECH_METHOD_MAP: Record<string, string> = {
  ORANGE_MONEY: "Orange Money",
  WAVE: "Wave",
  FREE_MONEY: "Free Money",
  CARD: "Carte Bancaire",
};

async function initiatePaytech(input: InitiateInput): Promise<InitiateResult> {
  const apiKey = process.env.PAYTECH_API_KEY;
  const apiSecret = process.env.PAYTECH_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error(
      "PayTech n'est pas configuré : renseignez PAYTECH_API_KEY et PAYTECH_API_SECRET dans .env",
    );
  }

  const target = PAYTECH_METHOD_MAP[input.method] ?? "";

  const response = await fetch(`${PAYTECH_BASE}/payment/request-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      API_KEY: apiKey,
      API_SECRET: apiSecret,
    },
    body: JSON.stringify({
      item_name: input.description,
      item_price: input.amount,
      currency: input.currency,
      ref_command: input.reference,
      command_name: input.description,
      env: process.env.PAYTECH_ENV ?? "test",
      target_payment: target,
      ipn_url: `${SITE_URL}/api/payments/webhook/paytech`,
      success_url: confirmationUrl(input.metadata),
      cancel_url: confirmationUrl(input.metadata),
      custom_field: JSON.stringify(input.metadata),
    }),
  });

  const data = (await response.json().catch(() => null)) as {
    success?: number;
    token?: string;
    redirect_url?: string;
    redirectUrl?: string;
    message?: string;
  } | null;

  if (!response.ok || data?.success !== 1 || !data?.token) {
    throw new Error(
      `PayTech : ${data?.message ?? "échec de l'initialisation"}`,
    );
  }

  const redirectUrl = data.redirect_url ?? data.redirectUrl;

  // Pré-remplissage du numéro de téléphone si méthode unique
  let finalUrl = redirectUrl;
  if (redirectUrl && target && !target.includes(",")) {
    const search = new URLSearchParams({ tp: target, nac: "1" });
    const separator = redirectUrl.includes("?") ? "&" : "?";
    finalUrl = `${redirectUrl}${separator}${search.toString()}`;
  }

  return {
    providerTxId: data.token,
    paymentUrl: finalUrl ?? null,
    success: true,
  };
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
