import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 bg-brand-900 text-brand-100">
      <div className="h-1 bg-gradient-to-r from-brand-700 via-sun-500 to-brand-700" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-sm shadow-sm">
              🛍️
            </span>
            THIADIAYE<span className="text-sun-400">.SHOP</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-200">
            Le portail d'annonces locales de Thiadiaye et du Sénégal. Achetez,
            vendez et louez simplement, près de chez vous.
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-brand-200">
            <li>📍 Thiadiaye, Sénégal</li>
            <li>📞 +221 77 000 00 00</li>
            <li>✉️ contact@thiadiaye.shop</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sun-400">
            Plateforme
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/annonces/nouvelles" className="transition hover:text-white">
                Publier une annonce
              </Link>
            </li>
            <li>
              <Link href="/annonces" className="transition hover:text-white">
                Toutes les annonces
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="transition hover:text-white">
                À propos
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sun-400">
            Légal
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/cgu" className="transition hover:text-white">
                Conditions d'utilisation
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="transition hover:text-white">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="transition hover:text-white">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sun-400">
            Paiement
          </h3>
          <ul className="space-y-2">
            {["Orange Money", "Wave", "Free Money"].map((p) => (
              <li
                key={p}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-brand-100 ring-1 ring-white/15"
              >
                <span className="h-2 w-2 rounded-full bg-sun-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-400">
        © {new Date().getFullYear()} THIADIAYE.SHOP — Tous droits réservés ·
        Fait avec ❤️ à Thiadiaye
      </div>
    </footer>
  );
}
