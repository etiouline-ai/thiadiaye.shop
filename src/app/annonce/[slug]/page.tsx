import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatPrice, formatDate, isFeatured } from "@/lib/format";
import { ImageGallery } from "@/components/ImageGallery";
import { ViewTracker } from "@/components/ViewTracker";
import { ListingCard } from "@/components/ListingCard";
import { DeleteListingButton } from "@/components/DeleteListingButton";

export const revalidate = 30;

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      category: { include: { parent: true } },
      seller: { select: { id: true, name: true, businessName: true, email: true } },
    },
  });

  if (!listing) notFound();

  const canView =
    listing.status === "PUBLISHED" ||
    listing.status === "SOLD" ||
    session?.id === listing.sellerId ||
    session?.role === "ADMIN";

  if (!canView) notFound();

  const featured = isFeatured(listing);
  const whatsapp =
    listing.whatsapp ?? listing.phone ?? "";
  const waLink = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    `Bonjour, je vous contacte au sujet de votre annonce « ${listing.title} » sur THIADIAYE.SHOP`,
  )}`;

  const related = await prisma.listing.findMany({
    where: { status: "PUBLISHED", categoryId: listing.categoryId, id: { not: listing.id } },
    orderBy: { createdAt: "desc" },
    take: 4,
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

  const isOwner = session?.id === listing.sellerId;
  const breadcrumbName = listing.category?.parent?.name ?? listing.category?.name;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <ViewTracker slug={listing.slug} />

      <nav className="mb-4 text-sm text-ink-400">
        <Link href="/" className="hover:text-brand-700">Accueil</Link>
        {" / "}
        <Link href="/annonces" className="hover:text-brand-700">Annonces</Link>
        {listing.category && (
          <>
            {" / "}
            <Link
              href={`/annonces?category=${listing.category.parent?.slug ?? listing.category.slug}`}
              className="hover:text-brand-700"
            >
              {breadcrumbName}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Galerie */}
        <div>
          <ImageGallery images={listing.images} />

          <div className="mt-6 rounded-xl border border-ink-200 bg-white p-5">
            <h2 className="mb-2 text-lg font-bold text-ink-900">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Info + contact */}
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold leading-snug text-ink-900">
                {listing.title}
              </h1>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {featured && listing.status === "PUBLISHED" && (
                <span className="rounded-full bg-sun-500 px-2.5 py-1 text-xs font-bold text-ink-900">
                  ⭐ À la une
                </span>
              )}
              {listing.status === "SOLD" && (
                <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                  VENDU
                </span>
              )}
              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                {listing.condition === "NEW" ? "Neuf" : "D'occasion"}
              </span>
              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                📅 {formatDate(listing.createdAt)}
              </span>
              <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                👁 {listing.views} vues
              </span>
            </div>

            <div className="mt-4 text-3xl font-extrabold text-brand-700">
              {formatPrice(listing.price)}
            </div>
            <div className="mt-1 text-sm text-ink-500">
              📍 {listing.city ?? "Sénégal"}
              {listing.district ? `, ${listing.district}` : ""}
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-600">
              Contacter le vendeur
            </h3>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                {(listing.seller.businessName ?? listing.seller.name)
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-ink-900">
                  {listing.seller.businessName ?? listing.seller.name}
                </div>
                <div className="text-xs text-ink-400">
                  Vendeur vérifié sur THIADIAYE.SHOP
                </div>
              </div>
            </div>

            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                📞 Appeler : {listing.phone}
              </a>
            )}
            {whatsapp && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                💬 Contacter sur WhatsApp
              </a>
            )}

            {listing.status === "PUBLISHED" && (
              <p className="mt-3 text-center text-xs text-ink-400">
                🔒 Ne payez jamais à l'avance. Rencontrez le vendeur dans un
                lieu sûr.
              </p>
            )}
          </div>

          {isOwner && (
            <div className="flex gap-2">
              <Link
                href={`/annonce/${listing.slug}/modifier`}
                className="flex-1 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                ✏️ Modifier
              </Link>
              <Link
                href={`/compte`}
                className="flex-1 rounded-lg border border-ink-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                ⭐ Mettre en avant
              </Link>
              <DeleteListingButton
                listingId={listing.id}
                confirmText="Supprimer cette annonce ?"
              />
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-ink-900">
            Annonces similaires
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
