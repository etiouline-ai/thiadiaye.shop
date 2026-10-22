import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ListingCard } from "@/components/ListingCard";
import { AdSlot } from "@/components/AdSlot";
import { adsSlots } from "@/lib/ads";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop) return { title: "Boutique" };
  return { title: `${shop.name} — Boutique`, description: shop.description ?? undefined };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const shop = await prisma.shop.findUnique({
    where: { slug },
    include: { owner: { select: { id: true } } },
  });

  if (!shop) notFound();

  const isOwner = session?.id === shop.owner.id;
  if (shop.status !== "ACTIVE" && !isOwner) notFound();

  const pendingNotice = isOwner && shop.status !== "ACTIVE";

  const listings = await prisma.listing.findMany({
    where: {
      sellerId: shop.owner.id,
      status: { in: ["PUBLISHED", "SOLD"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      city: true,
      district: true,
      condition: true,
      status: true,
      featuredUntil: true,
      createdAt: true,
      images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
    },
  });

  const publishedCount = listings.filter((l) => l.status === "PUBLISHED").length;
  const whatsapp = shop.whatsapp ?? shop.phone ?? "";
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je vous contacte au sujet de votre boutique « ${shop.name} » sur THIADIAYE.SHOP`,
  )}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {pendingNotice && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⏳ Cette boutique est en attente de paiement : elle n'est visible que
          par vous. Activez-la depuis{" "}
          <Link href="/compte/boutique" className="font-bold underline">
            Mon compte → Ma boutique
          </Link>
          .
        </div>
      )}

      {/* En-tête boutique */}
      <div className="card overflow-hidden">
        <div className="relative h-36 bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-600 sm:h-44">
          {shop.bannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shop.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute -bottom-16 right-10 h-52 w-52 rounded-full bg-sun-400/40 blur-3xl" />
            </div>
          )}
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end gap-4">
            <div className="relative -mt-12 z-10 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-100 text-3xl font-bold text-brand-700 shadow-lg">
              {shop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={shop.logoUrl}
                  alt={shop.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                shop.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex min-w-0 flex-1 pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">
                {shop.name}
              </h1>
              <p className="text-sm text-ink-500">
                {shop.city ? (
                  <>
                    <span className="text-base">📍</span> {shop.city}
                  </>
                ) : (
                  "Sénégal"
                )}{" "}
                · {publishedCount} annonce{publishedCount > 1 ? "s" : ""}
              </p>
            </div>
            {isOwner && (
              <Link
                href="/compte/boutique"
                className="mb-1 rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                ✏️ Gérer
              </Link>
            )}
          </div>

          {shop.description && (
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-600">
              {shop.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                <span className="text-base">📞</span> {shop.phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
              >
                <span className="text-base">💬</span> WhatsApp
              </a>
            )}
            {shop.website && (
              <a
                href={shop.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                🌐 Site web
              </a>
            )}
            {shop.facebook && (
              <a
                href={shop.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                📘 Facebook
              </a>
            )}
            {shop.instagram && (
              <a
                href={`https://instagram.com/${shop.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
              >
                📸 Instagram
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Annonces de la boutique */}
      <section className="mt-8">
        <div className="mb-5">
          <p className="eyebrow">Vitrine</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900">
            Annonces de la boutique ({listings.length})
          </h2>
        </div>
        {listings.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">
            Aucune annonce pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l, i) => (
              <Fragment key={l.id}>
                <ListingCard listing={l} />
                {i === 5 && (
                  <div className="col-span-full">
                    <AdSlot slot={adsSlots.listInline} className="min-h-24" label="Publicité" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        )}
      </section>

      <AdSlot slot={adsSlots.home} className="mx-auto mt-8 min-h-24 max-w-3xl" label="Publicité" />
    </div>
  );
}
