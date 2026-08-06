import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-ink-900">
        Politique de confidentialité
      </h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-600">
        <p>Dernière mise à jour : août 2026</p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">1. Données collectées</h2>
        <p>
          Nous collectons : votre nom, adresse email, numéro de téléphone, le
          contenu de vos annonces et vos données de paiement (via nos prestataires
          de paiement). Les mots de passe sont hachés et jamais stockés en clair.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">2. Utilisation</h2>
        <p>
          Vos données servent à gérer votre compte, publier vos annonces, traiter
          les paiements et assurer la modération. Nous ne vendons jamais vos
          données personnelles à des tiers.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">3. Sécurité</h2>
        <p>
          Le site utilise le chiffrement HTTPS, un hachage fort des mots de passe
          (bcrypt) et une protection contre les abus (limitation de connexions).
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">4. Cookies</h2>
        <p>
          Nous utilisons uniquement des cookies techniques essentiels au
          fonctionnement (session de connexion). Aucun traceur publicitaire.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">5. Vos droits</h2>
        <p>
          Vous pouvez demander l'accès, la rectification ou la suppression de vos
          données à tout moment en nous écrivant à contact@thiadiaye.shop.
        </p>
      </div>
    </div>
  );
}
