"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordResetAction } from "@/actions/auth";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await requestPasswordResetAction({ email });
          if (result.success) {
            setSent(true);
          }
        });
      }}
      className="space-y-4"
    >
      {sent ? (
        <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
          Si un compte existe avec cette adresse, un email de réinitialisation a
          été envoyé. <button type="button" className="underline" onClick={() => router.push("/auth/login")}>Retour à la connexion</button>
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-700">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
              placeholder="vous@exemple.com"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
          </button>
        </>
      )}
    </form>
  );
}
