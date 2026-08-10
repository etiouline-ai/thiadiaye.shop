"use client";

import { useTransition } from "react";
import { deleteListing } from "@/actions/listings";
import { useRouter } from "next/navigation";

export function DeleteListingButton({
  listingId,
  confirmText,
}: {
  listingId: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          await deleteListing(listingId);
          router.push("/compte");
          router.refresh();
        });
      }}
      disabled={pending}
      className="flex-1 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
    >
      {pending ? "…" : (
        <span>
          <span className="text-base">🗑</span> Supprimer
        </span>
      )}
    </button>
  );
}
