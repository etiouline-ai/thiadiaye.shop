import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-ink-900">À propos de THIADIAYE.SHOP</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-600">
        <p>
          <strong className="text-ink-800">THIADIAYE.SHOP</strong> est un portail
          de petites annonces en ligne au Sénégal, né à Thiadiaye. Notre mission :
          permettre à chacun d'<strong>acheter, vendre et louer simplement</strong>,
          près de chez soi, dans un environnement sûr.
        </p>
        <p>
          Nous mettons en relation directe acheteurs et vendeurs : véhicules,
          immobilier, matériel agricole, électronique, mode, emplois et services.
          Chaque annonce est publiée gratuitement puis <strong>modérée</strong> par
          notre équipe pour garantir la qualité et la confiance.
        </p>
        <h2 className="pt-2 text-lg font-bold text-ink-900">Nos engagements</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Publication d'annonces 100 % gratuite</li>
          <li>Modération humaine de chaque annonce</li>
          <li>Données protégées et chiffrées (HTTPS)</li>
          <li>Paiements sécurisés via Orange Money, Wave et Free Money</li>
          <li>Conseils de sécurité pour éviter les arnaques</li>
        </ul>
        <h2 className="pt-2 text-lg font-bold text-ink-900">Nos conseils de sécurité</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ne payez jamais à l'avance pour un article</li>
          <li>Rencontrez toujours le vendeur dans un lieu public et sûr</li>
          <li>Vérifiez le produit avant de payer</li>
          <li>Signalez toute annonce suspecte via le formulaire de contact</li>
        </ul>
        <p className="pt-2">
          Une question ?{" "}
          <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
            Contactez-nous
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
