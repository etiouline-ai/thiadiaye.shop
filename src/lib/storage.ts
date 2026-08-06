import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 2 * 1024 * 1024);
const MAX_WIDTH = 1600;

export type SavedImage = { url: string; mime: string; size: number };

export function ensureUploadsDir(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function uploadsPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

function extForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export async function saveImage(
  buffer: Buffer,
  mime: string,
): Promise<SavedImage> {
  if (!ALLOWED_TYPES.has(mime)) {
    throw new Error("Format d'image non autorisé (JPEG, PNG ou WebP uniquement)");
  }
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error("Image trop lourde (2 Mo maximum par image)");
  }

  ensureUploadsDir();

  const name = randomBytes(16).toString("hex");
  const ext = extForMime(mime);
  const filename = `${name}.${ext}`;

  const image = sharp(buffer, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Image invalide");
  }
  if (metadata.width > MAX_WIDTH) {
    image.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await image
    .withMetadata({ orientation: undefined })
    .jpeg({ quality: 82, progressive: true })
    .toFile(uploadsPath(filename));

  return { url: `/api/uploads/${filename}`, mime: "image/jpeg", size: buffer.byteLength };
}

export function deleteFile(url: string): void {
  if (!url.startsWith("/api/uploads/")) return;
  const filename = path.basename(url);
  const file = uploadsPath(filename);
  try {
    fs.unlinkSync(file);
  } catch {
    // fichier absent : ignorer
  }
}

export function getFile(filename: string): { data: Buffer; type: string } | null {
  const safe = path.basename(filename);
  const file = uploadsPath(safe);
  try {
    const data = fs.readFileSync(file);
    const ext = path.extname(safe).toLowerCase();
    const type =
      ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return { data, type };
  } catch {
    return null;
  }
}
