"use client";

import { useState } from "react";
import Link from "next/link";
import type { SessionUser } from "@/lib/auth";

export function MobileMenu({ session }: { session: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-300 text-xl text-ink-700 transition hover:bg-ink-100"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xl">
          <nav className="space-y-0.5 p-2 text-sm">
            <Link
              href="/annonces/nouvelles"
              onClick={close}
              className="block rounded-lg bg-sun-500 px-3 py-2.5 font-bold text-ink-900 transition hover:bg-sun-400"
            >
              + Publier une annonce
            </Link>
            <Link
              href="/annonces"
              onClick={close}
              className="block rounded-lg px-3 py-2.5 font-semibold text-ink-800 hover:bg-ink-50"
            >
              Toutes les annonces
            </Link>
            <Link
              href="/boutiques"
              onClick={close}
              className="block rounded-lg px-3 py-2.5 font-semibold text-ink-800 hover:bg-ink-50"
            >
              🏪 Boutiques
            </Link>
            {session ? (
              <>
                <Link
                  href="/compte/messages"
                  onClick={close}
                  className="block rounded-lg px-3 py-2.5 font-semibold text-ink-800 hover:bg-ink-50"
                >
                  💬 Messages
                </Link>
                <Link
                  href="/compte"
                  onClick={close}
                  className="block rounded-lg px-3 py-2.5 font-semibold text-ink-800 hover:bg-ink-50"
                >
                  Mon compte
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={close}
                className="block rounded-lg px-3 py-2.5 font-semibold text-ink-800 hover:bg-ink-50"
              >
                Se connecter
              </Link>
            )}
            <Link
              href="/a-propos"
              onClick={close}
              className="block rounded-lg px-3 py-2.5 text-ink-600 hover:bg-ink-50"
            >
              À propos
            </Link>
            <Link
              href="/contact"
              onClick={close}
              className="block rounded-lg px-3 py-2.5 text-ink-600 hover:bg-ink-50"
            >
              Contact
            </Link>
            <a
              href="tel:+221756568140"
              onClick={close}
              className="block rounded-lg px-3 py-2.5 text-ink-600 hover:bg-ink-50"
            >
              +221 75 656 8140
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
