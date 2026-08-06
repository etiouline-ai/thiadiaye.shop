import { createHmac, timingSafeEqual } from "node:crypto";

const CINETPAY_BASE =
  process.env.CINETPAY_BASE_URL ?? "https://api-checkout.cinetpay.com/v2";

export interface CinetpayCheckResult {
  succeeded: boolean;
  status: string;
  amount?: string;
  currency?: string;
}

/**
 * Vérifie une transaction CinetPay côté serveur (autorité finale).
 * https://docs.cinetpay.com/api/1.0-fr/checkout/notification
 */
export async function checkCinetpayTransaction(
  transactionId: string,
): Promise<CinetpayCheckResult> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) {
    throw new Error("CinetPay n'est pas configuré");
  }

  const response = await fetch(`${CINETPAY_BASE}/payment/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: apiKey,
    },
    body: new URLSearchParams({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }).toString(),
  });

  const data = (await response.json().catch(() => null)) as {
    code?: string;
    data?: {
      cpm_result?: string;
      cpm_trans_status?: string;
      status?: string;
      cpm_amount?: string;
      cpm_currency?: string;
    };
  } | null;

  const status =
    data?.data?.cpm_trans_status ??
    data?.data?.status ??
    data?.data?.cpm_result ??
    "";
  const succeeded =
    status === "00" ||
    status === "ACCEPTED" ||
    status === "SUCCESS" ||
    data?.data?.cpm_result === "00";

  return {
    succeeded,
    status,
    amount: data?.data?.cpm_amount,
    currency: data?.data?.cpm_currency,
  };
}

/**
 * Vérifie le jeton HMAC `x-token` envoyé par CinetPay dans le webhook.
 * Le payload est la concaténation des valeurs POST dans leur ordre d'arrivée,
 * signée en HMAC-SHA256 avec la clé secrète marchand.
 */
export function verifyCinetpayToken(
  token: string | null,
  secret: string,
  formValues: string[],
): boolean {
  if (!token || !secret) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(token, "hex");
  } catch {
    return false;
  }

  const attempts = [formValues.join(""), formValues.join("") + "\x00"];
  for (const payload of attempts) {
    const digest = createHmac("sha256", secret).update(payload).digest();
    if (digest.length === expected.length && timingSafeEqual(digest, expected)) {
      return true;
    }
  }
  return false;
}
