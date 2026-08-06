import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { isFeatured } from "@/lib/format";

export const revalidate = 60;

async function getHomeData() {
  const [categories, recent, featured] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      select: {
        slug: true,
        name: true,
        icon: true,
        description: true,
        _count: { select: { listings: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 12,
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
    prisma.listing.findMany({
      where: { status: "PUBLISHED", featuredUntil: { gt: new Date() } },
      orderBy: { featuredUntil: "desc" },
      take: 8,
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

  const featuredActive = featured.filter((l) => isFeatured(l));
  return { categories, recent, featured: featuredActive };
}

export default async function HomePage() {
  const { categories, recent, featured } = await getHomeData();

  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-b from-brand-800 to-brand-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Tout acheter, tout vendre,{" "}
            <span className="text-sun-400">près de chez vous</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brand-100">
            Annonces locales de Thiadiaye, Mbour et de tout le Sénégal.
            Publication gratuite, contact direct, paiement sécurisé par mobile
            money.
          </p>
          <form
            action="/annonces"
            method="get"
            className="mx-auto mt-6 flex max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg"
          >
            <input
              type="search"
              name="q"
              placeholder="Rechercher : voiture, terrain, téléphone, poulets…"
              className="w-full px-5 py-4 text-ink-800 outline-none"
            />
            <button
              type="submit"
              className="bg-sun-500 px-6 text-sm font-bold text-ink-900 transition hover:bg-sun-400"
            >
              Rechercher
            </button>
          </form>
          <Link
            href="/annonces/nouvelles"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/30 transition hover:bg-white/20"
          >
            ➕ Publier une annonce gratuite
          </Link>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">Catégories</h2>
          <Link
            href="/annonces"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/annonces?category=${cat.slug}`}
              className="flex flex-col items-center gap-1 rounded-xl border border-ink-200 bg-white p-4 text-center shadow-sm transition hover:border-brand-400 hover:shadow"
            >
              <span className="text-3xl">{cat.icon ?? "📦"}</span>
              <span className="text-sm font-semibold text-ink-800">
                {cat.name}
              </span>
              <span className="text-xs text-ink-400">
                {cat._count.listings} annonce
                {cat._count.listings > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink-900">
              ⭐ Annonces à la une
            </h2>
            <Link
              href="/annonces"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}

      {/* RECENT */}
      <section className="mx-auto max-w-6xl px-4 py-6 pb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink-900">Dernières annonces</h2>
          <Link
            href="/annonces"
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Voir tout →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-ink-500">
            <p className="text-lg">Aucune annonce pour le moment.</p>
            <p className="mt-1 text-sm">
              Soyez le premier à publier une annonce gratuite !
            </p>
            <Link
              href="/annonces/nouvelles"
              className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Publier une annonce
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
