"use client";

import { useTransition } from "react";
import { logoutUser } from "@/actions/auth";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await logoutUser();
          router.push("/");
          router.refresh();
        })
      }
      disabled={pending}
      className="rounded-lg border border-ink-300 px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-100 disabled:opacity-50"
    >
      {pending ? "…" : "Déconnexion"}
    </button>
  );
}
