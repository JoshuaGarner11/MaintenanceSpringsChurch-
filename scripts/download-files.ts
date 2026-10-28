// Copies photos and PDFs from MaintainX's servers onto this server, so they survive cancelling MaintainX.
//   npm run download:files
// If MaintainX refuses (401/403), sign in at app.getmaintainx.com in a browser, copy the request's
// Cookie header from the browser's developer tools, and run again with MAINTAINX_COOKIE="<cookie>".
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { uploadDir } from "../lib/uploads";

const db = new PrismaClient();

async function main() {
  const pending = await db.attachment.findMany({ where: { storageKey: null, sourceUrl: { not: null } } });
  console.log(`${pending.length} files to download`);
  let ok = 0;
  const failures: Record<string, number> = {};
  for (const a of pending) {
    try {
      const res = await fetch(a.sourceUrl!, { headers: process.env.MAINTAINX_COOKIE ? { cookie: process.env.MAINTAINX_COOKIE } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type")?.split(";")[0] ?? a.mimeType;
      if (type.startsWith("text/html")) throw new Error("got a web page (sign-in needed)");
      const ext = path.extname(a.fileName).toLowerCase() || (type === "application/pdf" ? ".pdf" : ".jpg");
      const storageKey = `maintainx/${randomUUID()}${ext}`;
      const full = path.join(uploadDir(), storageKey);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, Buffer.from(await res.arrayBuffer()));
      await db.attachment.update({ where: { id: a.id }, data: { storageKey, mimeType: type } });
      ok++;
    } catch (e) {
      const reason = (e as Error).message;
      failures[reason] = (failures[reason] ?? 0) + 1;
    }
  }
  console.log(`Downloaded ${ok} of ${pending.length}.`);
  for (const [reason, n] of Object.entries(failures)) console.log(`  ${n} failed: ${reason}`);
}

main().finally(() => db.$disconnect());
