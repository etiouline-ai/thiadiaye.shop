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
      className="group flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🛒
          </div>
        )}
        {listing.status === "SOLD" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded bg-red-600 px-3 py-1 text-sm font-bold text-white">
              VENDU
            </span>
          </div>
        )}
        {featured && listing.status === "PUBLISHED" && (
          <span className="absolute left-2 top-2 rounded-full bg-sun-500 px-2.5 py-1 text-xs font-bold text-ink-900 shadow">
            ⭐ À la une
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="text-base font-bold text-ink-900">
          {formatPrice(listing.price)}
        </div>
        <h3 className="line-clamp-2 text-sm font-medium text-ink-700 group-hover:text-brand-700">
          {listing.title}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-ink-400">
          <span className="line-clamp-1">
            {listing.city ? `📍 ${listing.city}` : ""}
            {listing.district ? `, ${listing.district}` : ""}
          </span>
          <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
