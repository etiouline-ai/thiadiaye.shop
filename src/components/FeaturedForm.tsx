"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { payForFeatured } from "@/actions/payments";
import { PAYMENT_METHODS, featuredPriceFCFA } from "@/lib/payments/pricing";

export function FeaturedForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("ORANGE_MONEY");
  const [days, setDays] = useState(7);

  const amount = featuredPriceFCFA(days);

  return (
    <div className="mt-4 rounded-lg border border-sun-200 bg-sun-50 p-4">
      <p className="mb-3 text-sm font-bold text-ink-800">
        ⭐ Mettre cette annonce en avant
      </p>
      <div className="mb-3 flex gap-2">
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
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-ink-600">
          Durée : {days} jour{days > 1 ? "s" : ""} — {amount.toLocaleString("fr-FR")} FCFA
        </label>
        <input
          type="range"
          min={7}
          max={30}
          step={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
      </div>
      {error && (
        <p className="mb-2 text-sm font-medium text-red-600">⚠️ {error}</p>
      )}
      <button
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await payForFeatured({
              listingId,
              method,
              days,
            });
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
        className="w-full rounded-lg bg-sun-500 px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-sun-400 disabled:opacity-50"
      >
        {pending ? "Redirection…" : `Payer ${amount.toLocaleString("fr-FR")} FCFA avec ${PAYMENT_METHODS.find((m) => m.value === method)?.label}`}
      </button>
    </div>
  );
}
