import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-ink-900">Mot de passe oublié</h1>
      <p className="mb-6 text-sm text-ink-500">
        Saisissez votre adresse email pour recevoir un lien de réinitialisation.
      </p>
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
      <p className="mt-4 text-center text-sm text-ink-500">
        <Link href="/auth/login" className="text-brand-700 hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
