"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function MockConfirmPayment({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function confirm(success: boolean) {
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/payments/webhook/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          status: success ? "success" : "failed",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erreur lors du paiement");
        return;
      }
      router.push("/compte");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm font-medium text-red-600">⚠️ {error}</p>
      )}
      <button
        onClick={() => confirm(true)}
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Traitement…" : "✅ Simuler le paiement réussi"}
      </button>
      <button
        onClick={() => confirm(false)}
        disabled={pending}
        className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50"
      >
        Annuler le paiement
      </button>
    </div>
  );
}
