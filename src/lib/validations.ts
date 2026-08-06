import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(60, "Le nom est trop long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(100, "Mot de passe trop long"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{9,15}$/, "Numéro de téléphone invalide (ex: +221 77 123 45 67)")
    .optional()
    .or(z.literal("")),
  businessName: z.string().trim().max(80).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(120, "Le titre est trop long (120 caractères max)"),
  description: z
    .string()
    .trim()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(5000, "La description est trop longue"),
  price: z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "Le prix doit être un nombre en FCFA")
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || v >= 0, "Prix invalide"),
  condition: z.enum(["NEW", "USED"]).default("USED"),
  categorySlug: z.string().min(1, "Catégorie requise"),
  city: z.string().trim().min(2, "Ville requise").max(60),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .regex(/^\+?\d{9,15}$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .regex(/^\+?\d{9,15}$/, "Numéro WhatsApp invalide")
    .optional()
    .or(z.literal("")),
});

export const featuredPriceSchema = z.object({
  listingId: z.string().min(1),
  method: z.enum(["ORANGE_MONEY", "WAVE", "FREE_MONEY"]),
  days: z.coerce.number().int().min(1).max(30).default(7),
});
