import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingCard } from "@/components/ListingCard";
import { AdSlot } from "@/components/AdSlot";
import { HeroSlider } from "@/components/HeroSlider";
import { isFeatured } from "@/lib/format";
import { adsSlots } from "@/lib/ads";

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
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-700 text-white">
        <HeroSlider />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-sun-500/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 text-center sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/20 backdrop-blur">
            🇸🇳 Thiadiaye &amp; tout le Sénégal
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Tout acheter, tout vendre,{" "}
            <span className="text-sun-400">près de chez vous</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">
            Annonces locales de Thiadiaye, Mbour et de tout le Sénégal.
            Publication gratuite, contact direct, paiement sécurisé par mobile
            money.
          </p>
          <form
            action="/annonces"
            method="get"
            className="mx-auto mt-8 flex max-w-2xl items-center gap-1 rounded-full bg-white p-1.5 shadow-2xl shadow-black/30"
          >
            <span className="pl-4 text-lg" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              name="q"
              placeholder="Rechercher : voiture, terrain, téléphone, poulets…"
              className="w-full bg-transparent px-3 py-2.5 text-sm text-ink-800 outline-none sm:text-base"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-sun-500 px-5 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-sun-400 sm:px-6"
            >
              Rechercher
            </button>
          </form>
          <div className="mt-4 text-xs text-brand-200 sm:text-sm">
            Populaire :{" "}
            {["Voiture", "Terrain", "Poulets", "Téléphone"].map((t) => (
              <Link
                key={t}
                href={`/annonces?q=${t}`}
                className="mx-0.5 inline-block rounded-full bg-white/10 px-3 py-1 font-medium ring-1 ring-white/20 transition hover:bg-white/20 hover:text-white"
              >
                {t}
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/annonces/nouvelles"
              className="btn-accent w-full sm:w-auto"
            >
              ➕ Publier une annonce gratuite
            </Link>
            <Link href="/annonces" className="btn-ghost w-full sm:w-auto">
              Découvrir les annonces
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Parcourir</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              Explorer les catégories
            </h2>
          </div>
          <Link
            href="/annonces"
            className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
          >
            Voir tout →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/annonces?category=${cat.slug}`}
              className="group card card-hover flex flex-col items-center gap-2 p-5 text-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-4xl ring-1 ring-brand-100 transition group-hover:scale-110 group-hover:bg-brand-100">
                {cat.icon ?? "📦"}
              </span>
              <span className="text-sm font-bold text-ink-800 transition group-hover:text-brand-700">
                {cat.name}
              </span>
              <span className="rounded-full bg-ink-50 px-2.5 py-0.5 text-xs font-medium text-ink-500">
                {cat._count.listings} annonce
                {cat._count.listings > 1 ? "s" : ""}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* PUBLICITÉ */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <AdSlot slot={adsSlots.home} className="mx-auto min-h-24 max-w-3xl" label="Publicité" />
      </div>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">⭐ En avant</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
                Annonces à la une
              </h2>
            </div>
            <Link
              href="/annonces"
              className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
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
      <section className="mx-auto max-w-6xl px-4 py-8 pb-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Nouveautés</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">
              Dernières annonces
            </h2>
          </div>
          <Link
            href="/annonces"
            className="inline-flex items-center gap-1 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-50"
          >
            Voir tout →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-5xl">🛍️</div>
            <p className="mt-3 text-lg font-semibold text-ink-800">
              Aucune annonce pour le moment.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              Soyez le premier à publier une annonce gratuite !
            </p>
            <Link href="/annonces/nouvelles" className="btn-primary mt-5">
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
