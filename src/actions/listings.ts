"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { listingSchema } from "@/lib/validations";
import { saveImage, deleteFile } from "@/lib/storage";
import type { SavedImage } from "@/lib/storage";
import { slugify } from "@/lib/slug";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import type { ListingStatus } from "@prisma/client";

const MAX_IMAGES = Number(process.env.MAX_IMAGES_PER_LISTING ?? 5);

export type ListingActionResult = { error?: string; listingId?: string };

async function extractImages(formData: FormData): Promise<Buffer[]> {
  const files: File[] = [];
  for (let i = 0; i < MAX_IMAGES; i++) {
    const file = formData.get(`image${i}`);
    if (file instanceof File && file.size > 0) files.push(file);
  }
  if (files.length > MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images par annonce`);
  }
  const buffers: Buffer[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    buffers.push(buffer);
  }
  return buffers;
}

export async function createListing(input: unknown): Promise<ListingActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous pour publier une annonce" };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Utilisateur introuvable" };

  const ip = await clientIp();
  const rl = rateLimit(`createListing:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return { error: `Trop de publications. Réessayez dans ${rl.retryAfter}s` };
  }

  const formData = input as FormData;
  const raw = Object.fromEntries(formData.entries());
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const category = await prisma.category.findUnique({
    where: { slug: data.categorySlug },
  });
  if (!category) return { error: "Catégorie invalide" };

  let images: Buffer[];
  try {
    images = await extractImages(formData);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const slug = `${slugify(data.title)}-${Date.now().toString(36)}`;
  const phone = data.phone || dbUser.phone || null;
  if (!phone) return { error: "Un numéro de téléphone est requis pour être contacté" };

  const savedImages: SavedImage[] = [];
  try {
    for (const buffer of images) {
      savedImages.push(await saveImage(buffer, detectMime(buffer)));
    }
  } catch (e) {
    for (const img of savedImages) {
      try {
        await deleteFile(img.url);
      } catch {
        // nettoyage best effort
      }
    }
    return { error: (e as Error).message };
  }

  try {
    const listing = await prisma.listing.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        price: data.price,
        condition: data.condition,
        city: data.city,
        district: data.district || null,
        phone,
        whatsapp: data.whatsapp || null,
        status: "PENDING",
        sellerId: user.id,
        categoryId: category.id,
        images: {
          create: savedImages.map((img, i) => ({ url: img.url, position: i })),
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/annonces");
    revalidatePath("/compte");
    return { listingId: listing.id };
  } catch (e) {
    for (const img of savedImages) {
      try {
        await deleteFile(img.url);
      } catch {
        // nettoyage best effort
      }
    }
    return { error: (e as Error).message };
  }
}

function detectMime(buffer: Buffer): string {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "image/webp";
  return "image/jpeg";
}

export async function updateListing(listingId: string, input: unknown): Promise<ListingActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous" };
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "Utilisateur introuvable" };

  const ip = await clientIp();
  const rl = rateLimit(`updateListing:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return { error: `Trop de modifications. Réessayez dans ${rl.retryAfter}s` };
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) {
    return { error: "Annonce introuvable" };
  }

  const formData = input as FormData;
  const raw = Object.fromEntries(formData.entries());
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const category = await prisma.category.findUnique({
    where: { slug: data.categorySlug },
  });
  if (!category) return { error: "Catégorie invalide" };

  let images: Buffer[] = [];
  try {
    images = await extractImages(formData);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const phone = data.phone || listing.phone || dbUser.phone || null;
  if (!phone) return { error: "Un numéro de téléphone est requis" };

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      condition: data.condition,
      city: data.city,
      district: data.district || null,
      phone,
      whatsapp: data.whatsapp || null,
      categoryId: category.id,
      status: listing.status === "REJECTED" ? "PENDING" : listing.status,
    },
  });

  if (images.length > 0) {
    const savedImages: SavedImage[] = [];
    try {
      for (const buffer of images) {
        savedImages.push(await saveImage(buffer, detectMime(buffer)));
      }
    } catch (e) {
      for (const img of savedImages) {
        try {
          await deleteFile(img.url);
        } catch {
          // nettoyage best effort
        }
      }
      return { error: (e as Error).message };
    }

    const existing = await prisma.image.findMany({ where: { listingId } });

    try {
      await prisma.$transaction(async (tx) => {
        await tx.image.deleteMany({ where: { listingId } });
        for (let i = 0; i < savedImages.length; i++) {
          await tx.image.create({
            data: { listingId, url: savedImages[i].url, position: i },
          });
        }
      });
    } catch (e) {
      for (const img of savedImages) {
        try {
          await deleteFile(img.url);
        } catch {
          // nettoyage best effort
        }
      }
      return { error: (e as Error).message };
    }

    for (const img of existing) {
      try {
        await deleteFile(img.url);
      } catch {
        // les fichiers supprimés n'existent plus
      }
    }
  }

  revalidatePath(`/annonce/${updated.slug}`);
  revalidatePath("/annonces");
  revalidatePath("/compte");
  return { listingId: updated.id };
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous" };

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) {
    return { error: "Annonce introuvable" };
  }

  const images = await prisma.image.findMany({ where: { listingId } });
  for (const img of images) await deleteFile(img.url);
  await prisma.listing.delete({ where: { id: listingId } });

  revalidatePath("/annonces");
  revalidatePath("/compte");
  return { success: true };
}

export async function markSold(listingId: string): Promise<ActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous" };

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== user.id) {
    return { error: "Annonce introuvable" };
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "SOLD" },
  });
  revalidatePath("/compte");
  return { success: true };
}

export async function incrementViews(slug: string): Promise<void> {
  try {
    await prisma.listing.update({
      where: { slug },
      data: { views: { increment: 1 } },
    });
  } catch {
    // silencieux
  }
}

export async function adminUpdateStatus(
  listingId: string,
  status: ListingStatus,
): Promise<ActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user || user.role !== "ADMIN") return { error: "Accès refusé" };

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Annonce introuvable" };

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status },
  });
  revalidatePath(`/annonce/${updated.slug}`);
  revalidatePath("/annonces");
  revalidatePath("/admin");
  return { success: true };
}

type ActionResult = { error?: string; success?: boolean };
