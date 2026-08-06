"use client";

import { useTransition } from "react";
import { adminUpdateStatus } from "@/actions/listings";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@prisma/client";

export function AdminActions({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(status: ListingStatus) {
    startTransition(async () => {
      await adminUpdateStatus(listingId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setStatus("PUBLISHED")}
        disabled={pending}
        className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        ✓ Publier
      </button>
      <button
        onClick={() => setStatus("REJECTED")}
        disabled={pending}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        ✕ Refuser
      </button>
    </div>
  );
}
