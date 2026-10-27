import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { readUpload } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentUser())) return new NextResponse("Sign in first", { status: 401 });
  const file = await db.attachment.findUnique({ where: { id: (await params).id } });
  if (!file) return new NextResponse("Not found", { status: 404 });
  if (!file.storageKey) {
    if (file.sourceUrl) return NextResponse.redirect(file.sourceUrl);
    return new NextResponse("Not found", { status: 404 });
  }
  const body = await readUpload(file.storageKey);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
