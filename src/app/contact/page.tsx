import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 text-3xl font-bold text-ink-900">Contactez-nous</h1>
      <div className="space-y-4 rounded-xl border border-ink-200 bg-white p-6">
        <div>
          <div className="text-sm font-bold text-ink-800">Téléphone</div>
          <a href="tel:+221770000000" className="text-sm text-brand-700 hover:underline">
            +221 77 000 00 00
          </a>
        </div>
        <div>
          <div className="text-sm font-bold text-ink-800">Email</div>
          <a href="mailto:contact@thiadiaye.shop" className="text-sm text-brand-700 hover:underline">
            contact@thiadiaye.shop
          </a>
        </div>
        <div>
          <div className="text-sm font-bold text-ink-800">Adresse</div>
          <div className="text-sm text-ink-600">Thiadiaye, région de Thiès, Sénégal</div>
        </div>
        <div>
          <div className="text-sm font-bold text-ink-800">Horaires</div>
          <div className="text-sm text-ink-600">
            Lundi - Samedi : 9h - 18h · Dimanche : fermé
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink-500">
        Pour signaler une annonce abusive ou une arnaque, écrivez-nous à
        contact@thiadiaye.shop avec le lien de l'annonce concernée.
      </p>
    </div>
  );
}
