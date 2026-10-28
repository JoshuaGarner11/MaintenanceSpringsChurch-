import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const uploadDir = () => process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp", "application/pdf"]);

export async function saveUpload(file: File): Promise<{ storageKey: string; fileName: string; mimeType: string } | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED.has(file.type)) throw new Error(`File type ${file.type || "unknown"} isn't allowed`);
  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
  const storageKey = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}${ext}`;
  const full = path.join(uploadDir(), storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(await file.arrayBuffer()));
  return { storageKey, fileName: file.name.slice(0, 200), mimeType: file.type };
}

export async function readUpload(storageKey: string): Promise<Buffer> {
  const root = path.resolve(uploadDir());
  const full = path.resolve(root, storageKey);
  if (!full.startsWith(root + path.sep)) throw new Error("Bad path");
  return readFile(full);
}
