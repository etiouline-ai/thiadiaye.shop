import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Modifier l'annonce" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect(`/auth/login?next=/annonces/${(await params).slug}/modifier`);

  const { slug } = await params;
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: { category: true, images: true },
  });

  if (!listing || listing.sellerId !== session.id) notFound();

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

  const categorySlug = listing.category.parentId
    ? listing.category.slug
    : listing.category.slug;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Modifier l'annonce</h1>
      <ListingForm
        categories={categories}
        edit={{
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          condition: listing.condition,
          categorySlug,
          city: listing.city ?? "Thiadiaye",
          district: listing.district,
          phone: listing.phone,
          whatsapp: listing.whatsapp,
        }}
      />
    </div>
  );
}
