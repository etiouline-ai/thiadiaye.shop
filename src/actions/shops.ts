"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { shopSchema, shopPaymentSchema } from "@/lib/validations";
import { saveImage, deleteFile } from "@/lib/storage";
import { slugify } from "@/lib/slug";
import { createShopPayment } from "@/lib/payments/service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type ShopActionResult = {
  error?: string;
  shopId?: string;
  shopSlug?: string;
  requiresPayment?: boolean;
};

export type ShopPaymentActionResult = {
  error?: string;
  paymentId?: string;
  paymentUrl?: string;
  amount?: number;
};

export async function payForShop(input: unknown): Promise<ShopPaymentActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous" };

  const ip = await clientIp();
  const rl = rateLimit(`payForShop:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return { error: `Trop de paiements initiés. Réessayez dans ${rl.retryAfter}s` };
  }

  const parsed = shopPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  try {
    const result = await createShopPayment({
      userId: user.id,
      shopId: parsed.data.shopId,
      method: parsed.data.method,
    });
    revalidatePath("/compte");
    revalidatePath("/compte/boutique");
    return {
      paymentId: result.payment.id,
      paymentUrl: result.paymentUrl ?? undefined,
      amount: result.amount,
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

function detectMime(buffer: Buffer): string {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "image/webp";
  return "image/jpeg";
}

async function readUpload(formData: FormData, key: string): Promise<Buffer | null> {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  return Buffer.from(await file.arrayBuffer());
}

async function ensureUniqueSlug(base: string): Promise<string> {
  const candidate = slugify(base) || "boutique";
  const existing = await prisma.shop.findUnique({ where: { slug: candidate } });
  if (!existing) return candidate;
  for (let i = 2; i < 100; i++) {
    const next = `${candidate}-${i}`;
    const taken = await prisma.shop.findUnique({ where: { slug: next } });
    if (!taken) return next;
  }
  return `${candidate}-${Date.now().toString(36)}`;
}

export async function saveShop(input: unknown): Promise<ShopActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { error: "Connectez-vous pour créer une boutique" };

  const ip = await clientIp();
  const rl = rateLimit(`saveShop:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return { error: `Trop d'opérations sur la boutique. Réessayez dans ${rl.retryAfter}s` };
  }

  const formData = input as FormData;
  const raw = Object.fromEntries(formData.entries());
  const parsed = shopSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const existing = await prisma.shop.findUnique({ where: { ownerId: user.id } });

  let logo: Buffer | null = null;
  let banner: Buffer | null = null;
  try {
    logo = await readUpload(formData, "logo");
    banner = await readUpload(formData, "banner");
  } catch (e) {
    return { error: (e as Error).message };
  }

  const savedFiles: string[] = [];
  let logoUrl = existing?.logoUrl ?? null;
  let bannerUrl = existing?.bannerUrl ?? null;
  try {
    if (logo) {
      logoUrl = (await saveImage(logo, detectMime(logo), { prefix: "shops/", maxWidth: 800 })).url;
      savedFiles.push(logoUrl);
    }
    if (banner) {
      bannerUrl = (await saveImage(banner, detectMime(banner), { prefix: "shops/", maxWidth: 1600 })).url;
      savedFiles.push(bannerUrl);
    }
  } catch (e) {
    for (const url of savedFiles) {
      try {
        await deleteFile(url, { prefix: "shops/" });
      } catch {
        // nettoyage best effort
      }
    }
    return { error: (e as Error).message };
  }

  let slug = existing?.slug ?? "";
  if (!existing) {
    slug = await ensureUniqueSlug(data.name);
  }

  const shop = await prisma.shop
    .upsert({
      where: { ownerId: user.id },
      update: {
        name: data.name,
        description: data.description || null,
        city: data.city || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        logoUrl,
        bannerUrl,
      },
      create: {
        name: data.name,
        slug,
        description: data.description || null,
        city: data.city || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        facebook: data.facebook || null,
        instagram: data.instagram || null,
        logoUrl,
        bannerUrl,
        status: "PENDING",
        ownerId: user.id,
      },
    })
    .catch(async (e: unknown) => {
      for (const url of savedFiles) {
        try {
          await deleteFile(url, { prefix: "shops/" });
        } catch {
          // nettoyage best effort
        }
      }
      throw e;
    });

  if (logo && existing?.logoUrl) {
    try {
      await deleteFile(existing.logoUrl, { prefix: "shops/" });
    } catch {
      // fichier déjà absent
    }
  }
  if (banner && existing?.bannerUrl) {
    try {
      await deleteFile(existing.bannerUrl, { prefix: "shops/" });
    } catch {
      // fichier déjà absent
    }
  }

  revalidatePath("/boutiques");
  revalidatePath(`/boutique/${shop.slug}`);
  revalidatePath("/compte");
  return {
    shopId: shop.id,
    shopSlug: shop.slug,
    requiresPayment: !existing,
  };
}
