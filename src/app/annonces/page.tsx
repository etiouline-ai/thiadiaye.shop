import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { AdSlot } from "@/components/AdSlot";
import { NavSelect } from "@/components/NavSelect";
import { CollapsibleFilters } from "@/components/CollapsibleFilters";
import { CITIES } from "@/lib/cities";
import { formatPrice } from "@/lib/format";
import { adsSlots } from "@/lib/ads";

export const revalidate = 30;

const PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  category?: string;
  city?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
}>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim();
  const categorySlug = params.category?.trim();
  const city = params.city?.trim();
  const min = params.min ? Number(params.min) : undefined;
  const max = params.max ? Number(params.max) : undefined;
  const sort = params.sort ?? "newest";
  const rawPage = Number(params.page ?? 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    select: {
      slug: true,
      name: true,
      icon: true,
      children: { select: { slug: true, name: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  const selected = categories.find((c) => c.slug === categorySlug);
  const selectedIds = selected
    ? [selected.slug, ...selected.children.map((c) => c.slug)]
    : undefined;

  const where: Record<string, unknown> = {
    status: "PUBLISHED",
  };
  if (q) {
    const normalized = q
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const like = `%${normalized}%`;
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Listing"
      WHERE status = 'PUBLISHED'
        AND (immutable_unaccent(lower(title)) LIKE ${like} OR immutable_unaccent(lower(description)) LIKE ${like})
      LIMIT 500
    `;
    where.id = { in: rows.map((r) => r.id) };
  }
  if (selectedIds) where.category = { slug: { in: selectedIds } };
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (min !== undefined || max !== undefined) {
    where.price = {
      ...(min !== undefined && !Number.isNaN(min) ? { gte: min } : {}),
      ...(max !== undefined && !Number.isNaN(max) ? { lte: max } : {}),
    };
  }

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function href(overrides: Record<string, string | undefined>) {
    const s = new URLSearchParams();
    if (q) s.set("q", q);
    if (categorySlug) s.set("category", categorySlug);
    if (city) s.set("city", city);
    if (min !== undefined && !Number.isNaN(min)) s.set("min", String(min));
    if (max !== undefined && !Number.isNaN(max)) s.set("max", String(max));
    if (sort !== "newest") s.set("sort", sort);
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined) s.delete(k);
      else s.set(k, v);
    }
    return `/annonces?${s.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink-900">
          {selected ? selected.name : q ? `Résultats pour « ${q} »` : "Toutes les annonces"}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {total} annonce{total > 1 ? "s" : ""} trouvée{total > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* FILTRES */}
        <CollapsibleFilters>
          <aside className="h-fit space-y-5 rounded-xl border border-ink-200 bg-white p-4 lg:sticky lg:top-32">
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-600">
              Catégories
            </h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href={href({ category: undefined, page: undefined })}
                  className={`block rounded px-2 py-1 text-sm ${!categorySlug ? "bg-brand-50 font-semibold text-brand-700" : "font-semibold text-ink-600 hover:bg-ink-50"}`}
                >
                  Toutes
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={href({ category: cat.slug, page: undefined })}
                    className={`block rounded px-2 py-1 text-sm ${categorySlug === cat.slug ? "bg-brand-50 font-semibold text-brand-700" : "font-semibold text-ink-600 hover:bg-ink-50"}`}
                  >
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </Link>
                  {selected?.slug === cat.slug && (
                    <ul className="ml-4 mt-1 space-y-0.5">
                      {cat.children.map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={href({ category: child.slug, page: undefined })}
                            className="block rounded px-2 py-0.5 text-xs text-ink-500 hover:text-brand-700"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-600">
              Localisation
            </h2>
            <NavSelect
              ariaLabel="Filtrer par localisation"
              value={city ? href({ city, page: undefined }) : href({ city: undefined, page: undefined })}
              options={[
                {
                  value: href({ city: undefined, page: undefined }),
                  label: "Tout le Sénégal",
                },
                ...CITIES.map((c) => ({
                  value: href({ city: c, page: undefined }),
                  label: c,
                })),
              ]}
            />
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-600">
              Prix (FCFA)
            </h2>
            <form action="/annonces" method="get" className="flex gap-2">
              <input type="hidden" name="category" value={categorySlug ?? ""} />
              <input type="hidden" name="q" value={q ?? ""} />
              <input type="hidden" name="city" value={city ?? ""} />
              <input
                type="number"
                name="min"
                defaultValue={min}
                placeholder="Min"
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                name="max"
                defaultValue={max}
                placeholder="Max"
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
              >
                OK
              </button>
            </form>
          </div>

          <AdSlot slot={adsSlots.list} label="Publicité" />
          </aside>
        </CollapsibleFilters>

        {/* LISTE */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex flex-wrap gap-1 text-sm">
              <NavSelect
                ariaLabel="Trier les annonces"
                value={href({ sort: sort !== "newest" ? sort : undefined, page: undefined })}
                options={[
                  { value: href({ sort: undefined, page: undefined }), label: "Plus récentes" },
                  { value: href({ sort: "price_asc", page: undefined }), label: "Prix croissant" },
                  { value: href({ sort: "price_desc", page: undefined }), label: "Prix décroissant" },
                ]}
              />
              {(q || categorySlug || city || min !== undefined || max !== undefined) && (
                <Link
                  href="/annonces"
                  className="rounded-lg border border-ink-300 px-3 py-2 font-medium text-ink-500 hover:bg-ink-50"
                >
                  <span className="text-base">✕</span> Réinitialiser
                </Link>
              )}
            </div>
            <span className="hidden text-sm text-ink-400 sm:block">
              Prix : {formatPrice(min)} - {formatPrice(max)}
            </span>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
              <p className="text-lg">Aucune annonce ne correspond à votre recherche.</p>
              <p className="mt-1 text-sm">Essayez d'élargir les filtres ou publiez votre propre annonce.</p>
              <Link
                href="/annonces/nouvelles"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                Publier une annonce
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={href({ page: String(page - 1) })}
                  className="rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium hover:bg-ink-50"
                >
                  <span className="text-base">←</span> Précédent
                </Link>
              )}
              <span className="px-2 text-sm text-ink-500">
                Page {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={href({ page: String(page + 1) })}
                  className="rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium hover:bg-ink-50"
                >
                  Suivant <span className="text-base">→</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
