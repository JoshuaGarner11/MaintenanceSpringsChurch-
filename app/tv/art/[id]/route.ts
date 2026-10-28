import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readUpload } from "@/lib/uploads";

// Paintings for the TV board. Public on purpose: the TV doesn't sign in, and they're only artwork.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const art = await db.artwork.findUnique({ where: { id: (await params).id } });
  if (!art) return new NextResponse("Not found", { status: 404 });
  const body = await readUpload(art.storageKey);
  return new NextResponse(new Uint8Array(body), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
