import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-12 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-lg font-extrabold text-white">
            THIADIAYE<span className="text-sun-400">.SHOP</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-brand-200">
            Le portail d'annonces locales de Thiadiaye et du Sénégal. Achetez,
            vendez et louez simplement, près de chez vous.
          </p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Plateforme
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/annonces/nouvelles" className="hover:underline">
                Publier une annonce
              </Link>
            </li>
            <li>
              <Link href="/annonces" className="hover:underline">
                Toutes les annonces
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="hover:underline">
                À propos
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Légal
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/cgu" className="hover:underline">
                Conditions d'utilisation
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:underline">
                Politique de confidentialité
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="hover:underline">
                Mentions légales
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">
            Paiement
          </h3>
          <ul className="space-y-2 text-sm">
            <li>Orange Money</li>
            <li>Wave</li>
            <li>Free Money</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-brand-800 py-4 text-center text-xs text-brand-300">
        © {new Date().getFullYear()} THIADIAYE.SHOP — Tous droits réservés ·
        Fait avec ❤️ à Thiadiaye
      </div>
    </footer>
  );
}
