import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes = [
    "",
    "/annonces",
    "/annonces/nouvelles",
    "/a-propos",
    "/contact",
    "/cgu",
    "/confidentialite",
    "/mentions-legales",
    "/auth/login",
    "/auth/register",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p === "/annonces" ? 0.9 : 0.6,
  }));

  let listingRoutes: MetadataRoute.Sitemap = [];
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    listingRoutes = listings.map((l) => ({
      url: `${base}/annonce/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // base de données indisponible au build : publier uniquement les routes statiques
  }

  return [...staticRoutes, ...listingRoutes];
}
