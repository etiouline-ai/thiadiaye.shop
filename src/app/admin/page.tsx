import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatPrice, formatDateShort } from "@/lib/format";
import { AdminActions } from "@/components/AdminActions";

export const metadata = { title: "Administration" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const [pending, published, users, revenue] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        seller: { select: { name: true, email: true, businessName: true } },
        category: { select: { name: true } },
        images: { select: { url: true }, take: 1 },
      },
    }),
    prisma.listing.count({ where: { status: "PUBLISHED" } }),
    prisma.user.count(),
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">
        Administration
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="text-2xl font-extrabold text-ink-900">
            {pending.length}
          </div>
          <div className="text-xs text-ink-500">À modérer</div>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="text-2xl font-extrabold text-ink-900">{published}</div>
          <div className="text-xs text-ink-500">Annonces publiées</div>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="text-2xl font-extrabold text-ink-900">{users}</div>
          <div className="text-xs text-ink-500">Utilisateurs</div>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          <div className="text-2xl font-extrabold text-brand-700">
            {(revenue._sum.amount ?? 0).toLocaleString("fr-FR")}
          </div>
          <div className="text-xs text-ink-500">FCFA encaissés</div>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-ink-900">
        Annonces à modérer ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="text-sm text-ink-500">Rien à modérer 🎉</p>
      ) : (
        <div className="space-y-3">
          {pending.map((listing) => (
            <div
              key={listing.id}
              className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {listing.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.images[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">
                    🛒
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-semibold text-ink-800">
                  {listing.title}
                </div>
                <div className="text-sm font-bold text-brand-700">
                  {formatPrice(listing.price)} · {listing.category.name}
                </div>
                <div className="text-xs text-ink-400">
                  {listing.seller.businessName ?? listing.seller.name} ·{" "}
                  {listing.seller.email} · {formatDateShort(listing.createdAt)}
                </div>
              </div>
              <Link
                href={`/annonce/${listing.slug}`}
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                Voir →
              </Link>
              <AdminActions listingId={listing.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
