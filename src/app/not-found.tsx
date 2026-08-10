import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="text-7xl">🔍</div>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Cette annonce ou cette page n'existe pas ou n'est plus disponible.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
