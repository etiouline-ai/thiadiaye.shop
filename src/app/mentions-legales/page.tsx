import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-ink-900">Mentions légales</h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink-600">
        <p>
          <strong className="text-ink-800">Éditeur :</strong> THIADIAYE.SHOP —
          Société basée à Thiadiaye, région de Thiès, Sénégal.
        </p>
        <p>
          <strong className="text-ink-800">Contact :</strong> contact@thiadiaye.shop ·
          +221 75 656 8140
        </p>
        <p>
          <strong className="text-ink-800">Directeur de la publication :</strong> le
          responsable de THIADIAYE.SHOP.
        </p>
        <p>
          <strong className="text-ink-800">Hébergement :</strong> chez un prestataire
          conforme à la réglementation en vigueur.
        </p>
        <p>
          <strong className="text-ink-800">Propriété intellectuelle :</strong> les
          contenus de ce site (textes, logos, design) sont protégés. Toute
          reproduction sans autorisation est interdite.
        </p>
        <p>
          <strong className="text-ink-800">Paiements :</strong> les transactions par
          mobile money sont traitées via des prestataires de paiement agréés
          (CinetPay ou équivalent). Nous ne stockons jamais vos numéros de carte.
        </p>
      </div>
    </div>
  );
}
