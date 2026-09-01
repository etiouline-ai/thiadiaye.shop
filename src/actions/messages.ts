"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveImage, deleteFile } from "@/lib/storage";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type MessageActionResult = {
  ok: boolean;
  error?: string;
  conversationId?: string;
  phone?: string | null;
};

function inFlow(userId: string, conversation: {
  buyerId: string;
  sellerId: string;
}): boolean {
  return userId === conversation.buyerId || userId === conversation.sellerId;
}

/** Extrait une image optionnelle du FormData d'un message. */
async function extractImage(formData: FormData): Promise<{ buffer: Buffer } | null> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength <= 0) return null;
  return { buffer };
}

function detectMime(buffer: Buffer): string {
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "image/webp";
  return "image/jpeg";
}

/**
 * L'acheteur initie une conversation à propos d'une annonce.
 * Le numéro du vendeur reste masqué tant que la conversation n'est pas ouverte.
 */
export async function startConversation(
  listingId: string,
): Promise<MessageActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Connectez-vous pour contacter le vendeur" };

  const ip = await clientIp();
  const rl = rateLimit(`conv:${ip}`, 30, 60_000);
  if (!rl.ok) return { ok: false, error: "Trop de conversations. Patientez un instant." };

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, title: true, status: true },
  });
  if (!listing) return { ok: false, error: "Annonce introuvable" };
  if (listing.sellerId === user.id) {
    return { ok: false, error: "C'est votre propre annonce" };
  }

  const existing = await prisma.conversation.findUnique({
    where: { listingId_buyerId: { listingId, buyerId: user.id } },
  });
  if (existing) return { ok: true, conversationId: existing.id };

  const conversation = await prisma.conversation.create({
    data: {
      listingId,
      buyerId: user.id,
      sellerId: listing.sellerId,
      messages: {
        create: {
          senderId: user.id,
          body: `Bonjour, je suis intéressé par « ${listing.title} ». Est-elle toujours disponible ?`,
        },
      },
    },
  });

  revalidatePath("/compte/messages");
  return { ok: true, conversationId: conversation.id };
}

export async function sendMessage(
  conversationId: string,
  input: unknown,
): Promise<MessageActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Connectez-vous" };

  const ip = await clientIp();
  const rl = rateLimit(`msg:${ip}`, 40, 60_000);
  if (!rl.ok) return { ok: false, error: "Envoi trop rapide. Patientez un instant." };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, buyerId: true, sellerId: true },
  });
  if (!conversation || !inFlow(user.id, conversation)) {
    return { ok: false, error: "Conversation introuvable" };
  }

  const formData = input as FormData;
  const body = (formData.get("body") as string | null)
    ?.replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000) ?? "";
  if (!body && !formData.has("image")) {
    return { ok: false, error: "Écris un message" };
  }

  const img = await extractImage(formData).catch(() => null);

  try {
    const saved = img
      ? await saveImage(img.buffer, detectMime(img.buffer), { prefix: "messages/", maxWidth: 1200 })
      : null;
    try {
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          body,
          ...(saved ? { imageUrl: saved.url } : {}),
          ...(user.id === conversation.buyerId
            ? { seenByBuyer: true }
            : { seenBySeller: true }),
        },
      });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
revalidatePath(`/compte/messages/${conversationId}`);
      revalidatePath("/compte/messages");
      return { ok: true, conversationId };
    } catch {
      if (saved) await deleteFile(saved.url).catch(() => {});
      return { ok: false, error: "Impossible d'enregistrer le message" };
    }
  } catch {
    return { ok: false, error: "Image trop lourde ou invalide" };
  }
}

export async function revealSellerPhone(
  conversationId: string,
): Promise<MessageActionResult> {
  const user = await requireUser().catch(() => null);
  if (!user) return { ok: false, error: "Connectez-vous" };

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { phone: true } },
      seller: { select: { phone: true } },
    },
  });
  if (!conversation || !inFlow(user.id, conversation)) {
    return { ok: false, error: "Conversation introuvable" };
  }

  if (!conversation.sellerPhoneRevealed) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { sellerPhoneRevealed: true },
    });
  }

  return {
    ok: true,
    conversationId,
    phone: conversation.listing.phone ?? conversation.seller.phone ?? null,
  };
}

export async function listConversations() {
  const user = await requireUser().catch(() => null);
  if (!user) return [];

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          images: { select: { url: true }, take: 1 },
        },
      },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, imageUrl: true, senderId: true, createdAt: true, seenByBuyer: true, seenBySeller: true },
      },
    },
  });

  return conversations.map((c) => {
    const last = c.messages[0];
    const unread =
      last && last.senderId !== user.id
        ? user.id === c.buyerId
          ? !last.seenByBuyer
          : !last.seenBySeller
        : false;
    return {
      id: c.id,
      listing: c.listing,
      otherName: user.id === c.buyerId ? c.seller.name : c.buyer.name,
      isBuyer: user.id === c.buyerId,
      sellerPhoneRevealed: c.sellerPhoneRevealed,
      lastBody: last?.imageUrl ? "🖼️ Photo" : last?.body ?? "",
      lastAt: last?.createdAt ?? c.updatedAt,
      unread,
    };
  });
}

export async function listMessages(conversationId: string) {
  const user = await requireUser().catch(() => null);
  if (!user) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, slug: true, title: true, price: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true, shop: { select: { slug: true, name: true, logoUrl: true } } } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation || !inFlow(user.id, conversation)) return null;

  // Marquage de lecture : tous les messages reçus par moi deviennent vus.
  const unread = conversation.messages.filter((m) =>
    m.senderId !== user.id &&
    (user.id === conversation.buyerId ? !m.seenByBuyer : !m.seenBySeller),
  );
  if (unread.length > 0) {
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        ...(user.id === conversation.buyerId
          ? { seenByBuyer: false }
          : { seenBySeller: false }),
      },
      data: user.id === conversation.buyerId
        ? { seenByBuyer: true }
        : { seenBySeller: true },
    });
  }

  return {
    id: conversation.id,
    listing: conversation.listing,
    otherName: user.id === conversation.buyerId ? conversation.seller.name : conversation.buyer.name,
    otherShop: conversation.seller.shop,
    isBuyer: user.id === conversation.buyerId,
    sellerPhoneRevealed: conversation.sellerPhoneRevealed,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
      mine: m.senderId === user.id,
    })),
  };
}

/** Retourne le nombre de conversations avec des messages non lus. */
export async function getUnreadCount(): Promise<number> {
  const user = await requireUser().catch(() => null);
  if (!user) return 0;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    select: {
      id: true,
      buyerId: true,
      sellerId: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { senderId: true, seenByBuyer: true, seenBySeller: true },
      },
    },
  });

  return conversations.filter((c) => {
    const last = c.messages[0];
    if (!last) return false;
    if (last.senderId === user.id) return false;
    return user.id === c.buyerId ? !last.seenByBuyer : !last.seenBySeller;
  }).length;
}