// Adds the paintings bundled in art/<collection>/ (with a sources.json) to the TV board.
// Safe to run on every start: paintings already added, or deleted by an admin, are left alone.
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { uploadDir } from "../lib/uploads";

type Source = { file: string; title: string; artist?: string; date?: string; collection?: string };

const db = new PrismaClient();
const root = path.join(process.cwd(), "art");

async function main() {
  // Once seeded, admins own the list; a deleted painting shouldn't come back on restart.
  if ((await db.artwork.count()) > 0) return;
  let added = 0;
  for (const dir of await readdir(root, { withFileTypes: true }).catch(() => [])) {
    if (!dir.isDirectory()) continue;
    const sources: Source[] = JSON.parse(await readFile(path.join(root, dir.name, "sources.json"), "utf8"));
    for (const s of sources) {
      const storageKey = `art/${dir.name}-${s.file}`;
      await mkdir(path.join(uploadDir(), "art"), { recursive: true });
      await copyFile(path.join(root, dir.name, s.file), path.join(uploadDir(), storageKey));
      const credit = [s.date, s.collection].filter(Boolean).join(" · ") || null;
      await db.artwork.create({ data: { title: s.title, artist: s.artist ?? null, credit, storageKey } });
      added++;
    }
  }
  if (added) console.log(`[art] added ${added} paintings to the TV board`);
}

main()
  .catch((e) => console.error("[art]", e))
  .finally(() => db.$disconnect());
