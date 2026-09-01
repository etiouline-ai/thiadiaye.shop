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
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  requestResetSchema,
} from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import {
  createEmailVerificationToken,
  consumeEmailVerificationToken,
  createPasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/tokens";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export type ActionResult = { error?: string; success?: boolean };

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function emailLayout(title: string, content: string): string {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:#15803d;color:#fff;padding:16px 24px;font-weight:bold;font-size:18px">THIADIAYE.SHOP</div>
  <div style="padding:24px"><h2 style="margin-top:0;color:#111827">${title}</h2>${content}</div>
  <div style="background:#f9fafb;color:#6b7280;padding:12px 24px;font-size:12px">Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</div>
</div>`;
}

export async function registerUser(input: unknown): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return { error: `Trop de tentatives. Réessayez dans ${rl.retryAfter}s` };
  }

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

  try {
    const raw = await createEmailVerificationToken(user.id);
    await sendEmail({
      to: user.email,
      subject: "Confirmez votre adresse email",
      html: emailLayout(
        "Confirmation de votre compte",
        `<p>Bonjour ${esc(user.name)},</p>
         <p>Merci de vous être inscrit sur THIADIAYE.SHOP. Confirmez votre adresse email en cliquant sur le lien ci-dessous :</p>
         <p><a href="${SITE_URL}/auth/verifier?token=${raw}" style="display:inline-block;background:#15803d;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Confirmer mon email</a></p>
         <p>Ce lien expire dans 1 heure.</p>`,
      ),
    });
  } catch {
    // l'email est un bonus : ne pas bloquer l'inscription
  }

  const token = await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);
  return { success: true };
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token) return { error: "Jeton manquant" };
  const userId = await consumeEmailVerificationToken(token);
  if (!userId) return { error: "Lien invalide ou expiré" };
  return { success: true };
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const ip = await clientIp();
  const rl = rateLimit(`reset:${ip}`, 3, 60_000);
  if (!rl.ok) {
    return { error: `Trop de demandes. Réessayez dans ${rl.retryAfter}s` };
  }

  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) return { error: "Adresse email invalide" };
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    try {
      const raw = await createPasswordResetToken(user.id);
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: emailLayout(
          "Réinitialisation du mot de passe",
          `<p>Bonjour ${esc(user.name)},</p>
           <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
           <p><a href="${SITE_URL}/auth/reinitialiser?token=${raw}" style="display:inline-block;background:#15803d;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">Réinitialiser mon mot de passe</a></p>
           <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`,
        ),
      });
    } catch {
      // ne pas divulguer si l'envoi échoue
    }
  }
  return { success: true };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Jeton ou mot de passe invalide" };
  }
  const { token, password } = parsed.data;

  const userId = await consumePasswordResetToken(token);
  if (!userId) return { error: "Lien invalide ou expiré" };

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { success: true };
}

export async function loginUser(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const data = parsed.data;

  const ip = await clientIp();
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
