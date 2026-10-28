import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadDir } from "./uploads";

// "Albert Bierstadt - Among the Sierra Nevada, California (1868).jpg" → artist + title.
export function titleFromFileName(fileName: string): { title: string; artist: string | null } {
  const base = path.basename(fileName).replace(/\.[a-z0-9]+$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const parts = base.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) return { artist: parts[0], title: parts.slice(1).join(" – ") };
  return { artist: null, title: base || "Untitled" };
}

// Shrinks a painting to TV size (2400px wide JPEG) so big museum scans load quickly on the TV.
export async function saveArtImage(file: File): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input, { limitInputPixels: 400_000_000 })
    .rotate()
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const storageKey = `art/${randomUUID()}.jpg`;
  const full = path.join(uploadDir(), storageKey);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, output);
  return storageKey;
}

// The painting for this hour, so the TV changes on the hour and every screen agrees.
export function pickForHour<T>(items: T[], now = new Date()): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(now.getTime() / 3600_000) % items.length];
}
