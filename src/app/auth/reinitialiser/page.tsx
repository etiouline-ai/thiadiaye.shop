import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = { title: "Réinitialisation du mot de passe" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <h1 className="mb-3 text-2xl font-bold text-ink-900">Lien invalide</h1>
        <p className="text-sm text-ink-500">
          Le lien de réinitialisation est manquant. Demandez-en un nouveau.
        </p>
        <Link
          href="/auth/mot-de-passe-oublie"
          className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold text-ink-900">Nouveau mot de passe</h1>
      <p className="mb-6 text-sm text-ink-500">
        Choisissez un mot de passe sécurisé pour votre compte.
      </p>
      <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}
