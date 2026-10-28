import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

// QR codes point at a page in this app, e.g. /assets/abc or /report/<location>, so any phone camera opens the record.
export async function GET(req: Request) {
  if (!(await currentUser())) return new NextResponse("Sign in first", { status: 401 });
  const path = new URL(req.url).searchParams.get("path") ?? "/";
  if (!/^\/(assets|locations|report)\/[\w-]+$/.test(path)) return new NextResponse("Bad path", { status: 400 });
  const base = process.env.APP_URL ?? new URL(req.url).origin;
  const svg = await QRCode.toString(new URL(path, base).toString(), { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return new NextResponse(svg, { headers: { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=86400" } });
}
