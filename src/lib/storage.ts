import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const STORAGE_DRIVER = process.env.STORAGE_DRIVER ?? "local";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 2 * 1024 * 1024);
const MAX_WIDTH = 1600;
const S3_PREFIX = "listings/";

const s3 =
  STORAGE_DRIVER === "s3"
    ? new S3Client({
        region: process.env.S3_REGION ?? "auto",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
        },
      })
    : null;

export type SavedImage = { url: string; mime: string; size: number };

export function ensureUploadsDir(): void {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function uploadsPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

export function uploadsPublicUrl(filename: string): string | null {
  const base = process.env.S3_PUBLIC_URL;
  if (STORAGE_DRIVER !== "s3" || !base) return null;
  return `${base.replace(/\/$/, "")}/${S3_PREFIX}${path.basename(filename)}`;
}

async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET ?? "",
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } else {
    fs.writeFileSync(uploadsPath(path.basename(key)), body);
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

  if (!s3) ensureUploadsDir();

  const name = randomBytes(16).toString("hex");
  const filename = `${name}.jpg`;

  const image = sharp(buffer, { failOn: "error" }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Image invalide");
  }
  if (metadata.width > MAX_WIDTH) {
    image.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  const processed = await image
    .withMetadata({ orientation: undefined })
    .jpeg({ quality: 82, progressive: true })
    .toBuffer();

  await putObject(`${S3_PREFIX}${filename}`, processed, "image/jpeg");

  return { url: `/api/uploads/${filename}`, mime: "image/jpeg", size: processed.byteLength };
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith("/api/uploads/")) return;
  const filename = path.basename(url);
  if (s3) {
    try {
      await s3.send(
        new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET ?? "", Key: `${S3_PREFIX}${filename}` }),
      );
    } catch {
      // objet absent : ignorer
    }
  } else {
    try {
      fs.unlinkSync(uploadsPath(filename));
    } catch {
      // fichier absent : ignorer
    }
  }
}

export async function getFile(filename: string): Promise<{ data: Buffer; type: string } | null> {
  const safe = path.basename(filename);
  const type = safe.endsWith(".png") ? "image/png" : safe.endsWith(".webp") ? "image/webp" : "image/jpeg";
  if (s3) {
    try {
      const res = await s3.send(
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET ?? "", Key: `${S3_PREFIX}${safe}` }),
      );
      if (!res.Body) return null;
      const data = await res.Body.transformToByteArray();
      return { data: Buffer.from(data), type };
    } catch {
      return null;
    }
  }
  try {
    const data = fs.readFileSync(uploadsPath(safe));
    return { data, type };
  } catch {
    return null;
  }
}
