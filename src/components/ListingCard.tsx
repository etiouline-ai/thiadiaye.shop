import Link from "next/link";
import Image from "next/image";
import { formatPrice, timeAgo, isFeatured } from "@/lib/format";

type ListingWithImages = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  city: string | null;
  district: string | null;
  status: string;
  featuredUntil: Date | null;
  createdAt: Date;
  images: { url: string }[];
  category?: { name: string; slug: string } | null;
  seller?: { name: string } | null;
};

export function ListingCard({ listing }: { listing: ListingWithImages }) {
  const featured = isFeatured(listing);
  const image = listing.images[0]?.url;

  return (
    <Link
      href={`/annonce/${listing.slug}`}
      className="group card card-hover flex flex-col"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-ink-100 to-ink-200">
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/80 text-5xl shadow-sm">
              🛒
            </span>
          </div>
        )}
        {featured && listing.status === "PUBLISHED" && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-sun-500 px-2.5 py-1 text-xs font-bold text-ink-900 shadow-md">
            <span className="text-sm">⭐</span> À la une
          </span>
        )}
        {listing.status === "SOLD" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white shadow">
              VENDU
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="text-lg font-extrabold text-ink-900">
          {formatPrice(listing.price)}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-ink-700 transition group-hover:text-brand-700">
          {listing.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-2.5 text-xs text-ink-400">
          <span className="line-clamp-1">
            {listing.city ? (
              <span>
                <span className="text-sm">📍</span> {listing.city}
              </span>
            ) : ""}
            {listing.district ? `, ${listing.district}` : ""}
          </span>
          <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
