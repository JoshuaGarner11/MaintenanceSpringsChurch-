"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { saveArtImage, titleFromFileName } from "@/lib/art";
import { uploadDir } from "@/lib/uploads";

// One image per call, so a whole folder can be sent without hitting the upload size limit.
export async function uploadArt(form: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireUser("ADMIN");
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No file" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "Not an image" };
  try {
    const storageKey = await saveArtImage(file);
    await db.artwork.create({ data: { ...titleFromFileName(file.name), storageKey } });
    return { ok: true };
  } catch (e) {
    console.error("[art]", file.name, e);
    return { ok: false, error: "Couldn't read this image" };
  }
}

export async function updateArt(id: string, form: FormData) {
  await requireUser("ADMIN");
  await db.artwork.update({
    where: { id },
    data: { title: String(form.get("title") ?? "").trim() || "Untitled", artist: String(form.get("artist") ?? "").trim() || null },
  });
  revalidatePath("/art");
}

export async function toggleArt(id: string) {
  await requireUser("ADMIN");
  const art = await db.artwork.findUniqueOrThrow({ where: { id } });
  await db.artwork.update({ where: { id }, data: { active: !art.active } });
  revalidatePath("/art");
}

export async function deleteArt(id: string) {
  await requireUser("ADMIN");
  const art = await db.artwork.delete({ where: { id } });
  await unlink(path.join(uploadDir(), art.storageKey)).catch(() => {});
  revalidatePath("/art");
}
