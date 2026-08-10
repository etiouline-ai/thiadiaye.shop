import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import { MobileMenu } from "@/components/MobileMenu";

export async function Navbar() {
  const [categories, session] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      select: { slug: true, name: true, icon: true },
      orderBy: { createdAt: "asc" },
    }),
    getSession(),
  ]);

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-brand-800 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5 text-xs">
          <span className="font-medium">
            <span className="text-base">📍</span> Thiadiaye &amp; tout le Sénégal — publiez gratuitement
          </span>
          <div className="hidden items-center gap-4 sm:flex">
            <Link href="/a-propos" className="hover:underline">
              À propos
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
            <a href="tel:+221770000000" className="hover:underline">
              +221 77 000 00 00
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0">
              <span className="text-xl font-extrabold tracking-tight text-brand-700">
                THIADIAYE<span className="text-sun-500">.SHOP</span>
              </span>
            </Link>

            <form
              action="/annonces"
              method="get"
              className="hidden flex-1 items-center md:flex"
            >
              <div className="flex w-full max-w-xl overflow-hidden rounded-lg border border-ink-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
                <input
                  type="search"
                  name="q"
                  placeholder="Que cherchez-vous ? (voiture, terrain, téléphone…)"
                  className="w-full px-4 py-2.5 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Rechercher
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/annonces/nouvelles"
                className="hidden rounded-lg bg-sun-500 px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:bg-sun-400 sm:inline-flex"
              >
                + Publier une annonce
              </Link>
              {session ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/compte"
                    className="rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100"
                  >
                    {session.name.split(" ")[0]}
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 sm:block"
                >
                  Connexion
                </Link>
              )}
              <MobileMenu session={session} />
            </div>
          </div>

          <form
            action="/annonces"
            method="get"
            className="mt-3 flex items-center md:hidden"
          >
            <div className="flex w-full overflow-hidden rounded-lg border border-ink-300 bg-white focus-within:border-brand-500">
              <input
                type="search"
                name="q"
                placeholder="Rechercher…"
                className="w-full px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="bg-brand-600 px-4 text-sm font-semibold text-white"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      </div>

      <nav className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-0 text-sm">
          <Link
            href="/annonces"
            className="whitespace-nowrap px-3 py-2.5 font-semibold text-brand-700 hover:bg-brand-50"
          >
            Toutes les annonces
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/annonces?category=${cat.slug}`}
              className="whitespace-nowrap px-3 py-2.5 text-ink-600 transition hover:bg-ink-50 hover:text-brand-700"
            >
              {cat.icon && <span className="mr-1 text-base">{cat.icon}</span>}
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
