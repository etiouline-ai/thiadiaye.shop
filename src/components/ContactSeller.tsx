"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startConversation } from "@/actions/messages";

export function ContactSeller({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function contact() {
    setBusy(true);
    setError(null);
    const res = await startConversation(listingId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Impossible de contacter le vendeur");
      return;
    }
    router.replace(`/compte/messages/${res.conversationId}`);
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          void contact();
        }}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        <span className="text-base">💬</span>
        {busy ? "Ouverture…" : "Contacter le vendeur"}
      </button>
      <p className="mt-2 text-center text-xs text-ink-400">
        <span className="text-base">🔒</span> Le numéro du vendeur sera révélé
        dans la conversation après votre premier message.
      </p>
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}