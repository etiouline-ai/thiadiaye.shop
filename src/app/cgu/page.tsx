import type { Metadata } from "next";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function CguPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-ink-900">
        Conditions d'utilisation
      </h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-600">
        <p>Dernière mise à jour : août 2026</p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">1. Service</h2>
        <p>
          THIADIAYE.SHOP est une plateforme de mise en relation entre vendeurs et
          acheteurs. Nous ne sommes pas partie à la transaction entre les
          utilisateurs. La qualité, la conformité et la légalité des biens ou
          services publiés relèvent de la responsabilité des vendeurs.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">2. Annonces</h2>
        <p>
          L'utilisateur s'engage à publier des annonces exactes, licites et
          conformes à la réglementation sénégalaise. Toute annonce frauduleuse,
          contrefaite ou interdite est interdite. Nous nous réservons le droit de
          supprimer toute annonce ne respectant pas ces conditions.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">3. Responsabilité</h2>
        <p>
          En cas de litige entre acheteur et vendeur, THIADIAYE.SHOP agit comme
          simple intermédiaire. Nous encourageons les rencontres en personne et le
          paiement à la livraison. Ne payez jamais à l'avance.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">4. Compte</h2>
        <p>
          Vous êtes responsable de la confidentialité de vos identifiants.
          L'utilisation de faux renseignements entraîne la suppression du compte.
        </p>
      </div>
    </div>
  );
}
