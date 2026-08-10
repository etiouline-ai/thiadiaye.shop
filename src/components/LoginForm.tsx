"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/actions/auth";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/compte";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          const result = await loginUser(Object.fromEntries(formData.entries()));
          if (result.error) {
            setError(result.error);
            return;
          }
          router.push(next);
          router.refresh();
        })
      }
      className="space-y-4"
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <span className="text-base">⚠️</span> {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink-700">
          Adresse email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-ink-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-ink-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div className="text-right">
        <Link
          href="/auth/mot-de-passe-oublie"
          className="text-xs font-medium text-brand-700 hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-center text-sm text-ink-500">
        Pas encore de compte ?{" "}
        <Link
          href={`/auth/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          Créer un compte gratuit
        </Link>
      </p>
    </form>
  );
}
