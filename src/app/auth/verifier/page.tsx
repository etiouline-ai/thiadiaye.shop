import Link from "next/link";
import { consumeEmailVerificationToken } from "@/lib/tokens";

export const metadata = { title: "Vérification de l'email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? !!(await consumeEmailVerificationToken(token)) : false;

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      {ok ? (
        <>
          <h1 className="mb-3 text-2xl font-bold text-ink-900">Email confirmé ✓</h1>
          <p className="mb-6 text-sm text-ink-500">
            Votre adresse email est maintenant vérifiée. Vous pouvez publier des
            annonces en toute confiance.
          </p>
          <Link
            href="/compte"
            className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Aller à mon compte
          </Link>
        </>
      ) : (
        <>
          <h1 className="mb-3 text-2xl font-bold text-ink-900">Lien invalide ou expiré</h1>
          <p className="text-sm text-ink-500">
            Ce lien de confirmation est invalide ou a expiré.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Retour à l'accueil
          </Link>
        </>
      )}
    </div>
  );
}
