import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";

export const metadata = { title: "Publier une annonce" };

export default async function NewListingPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login?next=/annonces/nouvelles");

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">
        Publier une annonce
      </h1>
      <p className="mb-6 -mt-4 text-sm text-ink-500">
        Gratuit. Votre annonce sera publiée après validation par notre équipe,
        généralement sous 24 h.
      </p>
      <ListingForm categories={categories} />
    </div>
  );
}
