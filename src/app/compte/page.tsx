import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatPrice, formatDateShort, isFeatured } from "@/lib/format";
import { FeaturedForm } from "@/components/FeaturedForm";
import { DeleteListingButton } from "@/components/DeleteListingButton";
import { MarkSoldButton } from "@/components/MarkSoldButton";

export const metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const [listings, payments] = await Promise.all([
    prisma.listing.findMany({
      where: { sellerId: session.id },
      orderBy: { createdAt: "desc" },
      include: {
        images: { select: { url: true }, orderBy: { position: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    PUBLISHED: "Publiée",
    REJECTED: "Refusée",
    SOLD: "Vendue",
    ARCHIVED: "Archivée",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            Bonjour, {session.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-ink-500">{session.email}</p>
        </div>
        <Link
          href="/annonces/nouvelles"
          className="rounded-lg bg-sun-500 px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-sun-400"
        >
          + Publier une annonce
        </Link>
      </div>

      <h2 className="mb-3 text-lg font-bold text-ink-900">
        Mes annonces ({listings.length})
      </h2>
      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center">
          <p className="text-ink-500">Vous n'avez pas encore d'annonce.</p>
          <Link
            href="/annonces/nouvelles"
            className="mt-3 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            Publier ma première annonce
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const featured = isFeatured(listing);
            return (
              <div
                key={listing.id}
                className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/annonce/${listing.slug}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    {listing.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.images[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        🛒
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-1 font-semibold text-ink-800">
                      {listing.title}
                    </div>
                    <div className="text-sm font-bold text-brand-700">
                      {formatPrice(listing.price)}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          listing.status === "PUBLISHED"
                            ? "bg-brand-100 text-brand-700"
                            : listing.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-ink-100 text-ink-600"
                        }`}
                      >
                        {statusLabels[listing.status]}
                      </span>
                      <span>· {formatDateShort(listing.createdAt)}</span>
                      <span>· {listing.views} vues</span>
                      {featured && (
                        <span className="rounded-full bg-sun-200 px-2 py-0.5 font-semibold text-ink-800">
                          <span className="text-sm">⭐</span> À la une
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  {listing.status === "PUBLISHED" && (
                    <MarkSoldButton listingId={listing.id} />
                  )}
                  <Link
                    href={`/annonce/${listing.slug}/modifier`}
                    className="rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
                  >
                    <span className="text-lg">✏️</span>
                  </Link>
                  <DeleteListingButton
                    listingId={listing.id}
                    confirmText="Supprimer cette annonce ?"
                  />
                </div>

                {listing.status === "PUBLISHED" && (
                  <div className="sm:w-72">
                    <FeaturedForm listingId={listing.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-bold text-ink-900">
        Historique des paiements
      </h2>
      {payments.length === 0 ? (
        <p className="text-sm text-ink-500">
          Aucun paiement pour le moment. Mettez vos annonces en avant avec
          Orange Money, Wave ou Free Money.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Objet</th>
                <th className="px-4 py-3">Moyen</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-ink-500">
                    {formatDateShort(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {p.type === "FEATURED_LISTING" ? "Mise en avant" : "Compte pro"}
                  </td>
                  <td className="px-4 py-3">{p.method.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-semibold">
                    {p.amount.toLocaleString("fr-FR")} FCFA
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.status === "SUCCESS"
                          ? "bg-brand-100 text-brand-700"
                          : p.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {p.status === "SUCCESS"
                        ? "Payé"
                        : p.status === "FAILED"
                          ? "Échoué"
                          : "En attente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
