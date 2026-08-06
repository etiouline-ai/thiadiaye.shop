"use client";

import { useTransition } from "react";
import { markSold } from "@/actions/listings";
import { useRouter } from "next/navigation";

export function MarkSoldButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markSold(listingId);
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
    >
      {pending ? "…" : "✓ Vendu"}
    </button>
  );
}
