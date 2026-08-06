import { randomBytes, createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 h

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
  const raw = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return raw;
}

export async function consumeEmailVerificationToken(raw: string): Promise<string | null> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return record.userId;
}

export async function createPasswordResetToken(userId: string): Promise<string> {
  const raw = generateToken();
  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  return raw;
}

export async function consumePasswordResetToken(raw: string): Promise<string | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) return null;
  if (record.usedAt) return null;

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record.userId;
}
