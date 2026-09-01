"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { payForShop } from "@/actions/shops";
import { PAYMENT_METHODS, SHOP_CREATION_PRICE_FCFA } from "@/lib/payments/pricing";

export function ShopPaymentPanel({ shopId }: { shopId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("ORANGE_MONEY");

  return (
    <div className="rounded-xl border border-sun-200 bg-sun-50 p-5">
      <p className="text-sm font-bold text-ink-800">
        🏪 Activation de votre boutique
      </p>
      <p className="mt-1 text-sm text-ink-600">
        Pour que votre boutique soit visible dans l'annuaire, réglez les{" "}
        <span className="font-bold text-brand-700">
          {SHOP_CREATION_PRICE_FCFA.toLocaleString("fr-FR")} FCFA
        </span>{" "}
        (paiement unique) par mobile money. Les modifications restent gratuites
        et illimitées.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setMethod(m.value)}
            className={`rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition ${
              method === m.value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-300 bg-white text-ink-600 hover:border-brand-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">
          <span className="text-base">⚠️</span> {error}
        </p>
      )}

      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await payForShop({ shopId, method });
            if (result.error) {
              setError(result.error);
              return;
            }
            if (result.paymentUrl) {
              router.push(result.paymentUrl);
            } else {
              router.push(`/compte/paiement/${result.paymentId}`);
            }
          })
        }
        disabled={pending}
        className="mt-4 w-full rounded-lg bg-sun-500 px-4 py-3 text-sm font-bold text-ink-900 transition hover:bg-sun-400 disabled:opacity-50"
      >
        {pending
          ? "Redirection…"
          : `Payer ${SHOP_CREATION_PRICE_FCFA.toLocaleString("fr-FR")} FCFA avec ${
              PAYMENT_METHODS.find((m) => m.value === method)?.label
            }`}
      </button>
    </div>
  );
}
