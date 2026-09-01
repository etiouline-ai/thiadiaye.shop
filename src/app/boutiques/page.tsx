import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata = { title: "Boutiques" };

export default async function ShopsDirectoryPage() {
  const shops = await prisma.shop.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      name: true,
      logoUrl: true,
      city: true,
      ownerId: true,
    },
  });

  const ownerIds = shops.map((s) => s.ownerId);
  const counts = ownerIds.length
    ? await prisma.listing.groupBy({
        by: ["sellerId"],
        where: { sellerId: { in: ownerIds }, status: "PUBLISHED" },
        _count: { _all: true },
      })
    : [];
  const countByOwner = new Map(counts.map((c) => [c.sellerId, c._count._all]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <p className="eyebrow">Vendeurs</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink-900">
          Les boutiques de Thiadiaye
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          Retrouvez les vendeurs et commerçants qui proposent leurs produits et
          services sur THIADIAYE.SHOP.
        </p>
      </div>

      {shops.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl">🏪</div>
          <p className="mt-3 text-lg font-semibold text-ink-800">
            Aucune boutique pour le moment.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Soyez le premier à ouvrir votre boutique gratuite.
          </p>
          <Link href="/compte/boutique" className="btn-primary mt-5">
            Créer ma boutique
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => {
            const listingCount = countByOwner.get(shop.ownerId) ?? 0;
            return (
              <Link
                key={shop.slug}
                href={`/boutique/${shop.slug}`}
                className="group card card-hover flex items-center gap-4 p-5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-3xl ring-1 ring-brand-100">
                  {shop.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={shop.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    shop.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="line-clamp-1 font-bold text-ink-900 transition group-hover:text-brand-700">
                    {shop.name}
                  </div>
                  <div className="mt-0.5 text-sm text-ink-500">
                    {shop.city ?? "Sénégal"}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-brand-700">
                    {listingCount} annonce
                    {listingCount > 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
