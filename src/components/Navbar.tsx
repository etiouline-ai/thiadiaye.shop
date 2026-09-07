import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getUnreadCount } from "@/actions/messages";
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

  const unread = session ? await getUnreadCount() : 0;

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink-900 text-white">
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

      <div className="border-b border-ink-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="shrink-0">
              <span className="flex items-center gap-2 text-xl font-bold tracking-tight text-ink-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-base text-white shadow-sm">
                  🛍️
                </span>
                THIADIAYE<span className="text-brand-600">.SHOP</span>
              </span>
            </Link>

            <form
              action="/annonces"
              method="get"
              className="hidden flex-1 items-center md:flex"
            >
              <div className="flex w-full max-w-xl items-center overflow-hidden rounded-full border border-ink-200 bg-white shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200">
                <span className="pl-4 text-sm" aria-hidden="true">
                  🔍
                </span>
                <input
                  type="search"
                  name="q"
                  placeholder="Que cherchez-vous ? (voiture, terrain, téléphone…)"
                  className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
                />
                <button
                  type="submit"
                  className="m-1 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Rechercher
                </button>
              </div>
            </form>

            <div className="ml-auto flex items-center gap-2">
              <Link
                href="/annonces/nouvelles"
                className="hidden rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 sm:inline-flex"
              >
                + Publier une annonce
              </Link>
              {session ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/compte/messages"
                    className="relative rounded-full border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100"
                    title="Mes messages"
                  >
                    💬 Messages
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/compte"
                    className="rounded-full border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100"
                  >
                    {session.name.split(" ")[0]}
                  </Link>
                  <LogoutButton />
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden rounded-full border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 sm:block"
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
            <div className="flex w-full items-center overflow-hidden rounded-full border border-ink-200 bg-white shadow-sm focus-within:border-brand-400">
              <span className="pl-3 text-sm" aria-hidden="true">
                🔍
              </span>
              <input
                type="search"
                name="q"
                placeholder="Rechercher…"
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="m-1 shrink-0 rounded-full bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      </div>

      <nav className="border-b border-ink-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-0 text-sm">
          <Link
            href="/annonces"
            className="whitespace-nowrap rounded-full px-3 py-2 font-semibold text-brand-700 hover:bg-brand-50"
          >
            Toutes les annonces
          </Link>
          <Link
            href="/boutiques"
            className="whitespace-nowrap rounded-full px-3 py-2 font-semibold text-ink-800 hover:bg-brand-50 hover:text-brand-700"
          >
            🏪 Boutiques
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/annonces?category=${cat.slug}`}
              className="whitespace-nowrap rounded-full px-3 py-2 text-ink-600 transition hover:bg-ink-50 hover:text-brand-700"
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
