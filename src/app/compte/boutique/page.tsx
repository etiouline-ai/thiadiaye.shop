import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ShopForm } from "@/components/ShopForm";
import { ShopPaymentPanel } from "@/components/ShopPaymentPanel";

export const metadata = { title: "Ma boutique" };

export default async function ShopPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const shop = await prisma.shop.findUnique({
    where: { ownerId: session.id },
  });

  const isActive = shop?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            {shop ? "Ma boutique" : "Créer ma boutique"}
          </h1>
          <p className="text-sm text-ink-500">
            {shop
              ? "Modifiez les informations de votre boutique à tout moment — gratuitement et sans limite."
              : "Votre vitrine sur THIADIAYE.SHOP — vos annonces y seront regroupées."}
          </p>
        </div>
        <Link
          href="/compte"
          className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
        >
          ← Retour au compte
        </Link>
      </div>

      {shop && isActive && (
        <Link
          href={`/boutique/${shop.slug}`}
          className="mb-6 block rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
        >
          🔗 Voir ma boutique publique : thiadiaye.shop/boutique/{shop.slug}
        </Link>
      )}

      {shop && !isActive && (
        <div className="mb-6 space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            ⏳ Votre boutique est créée mais <strong>en attente de paiement</strong>{" "}
            (5000 FCFA, paiement unique). Elle ne sera visible dans l'annuaire
            qu'après son activation. Vous pouvez déjà modifier ses informations
            ci-dessous.
          </div>
          <ShopPaymentPanel shopId={shop.id} />
        </div>
      )}

      <ShopForm
        shop={
          shop
            ? {
                name: shop.name,
                description: shop.description,
                city: shop.city,
                phone: shop.phone,
                whatsapp: shop.whatsapp,
                website: shop.website,
                facebook: shop.facebook,
                instagram: shop.instagram,
                logoUrl: shop.logoUrl,
                bannerUrl: shop.bannerUrl,
              }
            : null
        }
      />
    </div>
  );
}
