"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordAction } from "@/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (password !== confirm) {
          setError("Les deux mots de passe ne correspondent pas");
          return;
        }
        startTransition(async () => {
          const result = await resetPasswordAction({ token, password });
          if (result.success) {
            router.push("/auth/login");
          } else {
            setError(result.error ?? "Échec de la réinitialisation");
          }
        });
      }}
      className="space-y-4"
    >
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-700">
          Nouveau mot de passe
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
          placeholder="8 caractères minimum"
        />
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-ink-700">
          Confirmez le mot de passe
        </label>
        <input
          id="confirm"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? "Réinitialisation…" : "Réinitialiser le mot de passe"}
      </button>
    </form>
  );
}
