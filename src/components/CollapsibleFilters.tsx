"use client";

import { useState } from "react";

// Sur mobile, les filtres sont repliés par défaut derrière un bouton.
export function CollapsibleFilters({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between gap-2 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-ink-50 lg:hidden"
      >
        <span>Filtres et catégories</span>
        <span className="text-xs text-ink-400">{open ? "Masquer" : "Afficher"}</span>
        <span className="text-base leading-none">{open ? "✕" : "▼"}</span>
      </button>
      <div className={open ? "block" : "hidden lg:block"}>{children}</div>
    </div>
  );
}
