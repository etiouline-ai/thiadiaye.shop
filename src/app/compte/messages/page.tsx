import Link from "next/link";
import { listConversations } from "@/actions/messages";
import { formatPrice, timeAgo } from "@/lib/format";

export const metadata = { title: "Mes messages" };

export default async function MessagesPage() {
  const conversations = await listConversations();

  const empty = conversations.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Mes messages</h1>

      {empty ? (
        <div className="rounded-xl border border-dashed border-ink-300 bg-white p-12 text-center">
          <div className="text-5xl">💬</div>
          <p className="mt-3 font-semibold text-ink-800">
            Aucune conversation pour le moment.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Contacte un vendeur depuis une annonce et retrouve ici vos échanges.
          </p>
          <Link
            href="/annonces"
            className="btn-primary mt-5 inline-block"
          >
            Parcourir les annonces
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/compte/messages/${c.id}`}
                className="flex items-center gap-4 rounded-xl border border-ink-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  {c.listing.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.listing.images[0].url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ink-900">
                      {c.otherName}
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">
                      {timeAgo(c.lastAt)}
                    </span>
                  </div>
                  <div className="line-clamp-1 text-sm text-ink-500">
                    {c.listing.title} · {formatPrice(c.listing.price)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="line-clamp-1 text-sm text-ink-600">
                      {c.lastBody}
                    </span>
                    {c.unread && (
                      <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}