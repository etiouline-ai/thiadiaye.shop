"use server";

import { prisma } from "@/lib/db";
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
  verifyPassword,
  getSession,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult = { error?: string; success?: boolean };

export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "Un compte existe déjà avec cet email" };

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone || null,
      businessName: data.businessName || null,
    },
  });

  const token = await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  return { success: true };
}

export async function loginUser(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const ip = "auth";
  const rl = rateLimit(`login:${data.email}:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s` };
  }

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return { error: "Email ou mot de passe incorrect" };

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) return { error: "Email ou mot de passe incorrect" };

  const token = await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  return { success: true };
}

export async function logoutUser(): Promise<ActionResult> {
  await clearSessionCookie();
  return { success: true };
}

export async function currentUser() {
  return getSession();
}
