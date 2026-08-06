"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentStatusPoller({ pending }: { pending: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [pending, router]);

  if (!pending) return null;

  return (
    <p className="mt-2 flex items-center gap-2 text-xs text-ink-500">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      En attente de confirmation… cette page se met à jour automatiquement.
    </p>
  );
}
