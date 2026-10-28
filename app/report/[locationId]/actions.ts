"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { str } from "@/lib/format";
import { alertAdmins } from "@/lib/notify";
import { GLOBAL_HOURLY_LIMIT, ISSUES, PER_IP_LIMIT, PER_IP_MINUTES } from "@/lib/report";
import { saveUpload } from "@/lib/uploads";

export type ReportState = { ok?: boolean; error?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  return createHash("sha256").update(`report:${ip}`).digest("hex").slice(0, 32);
}

export async function submitReport(locationId: string, _prev: ReportState, form: FormData): Promise<ReportState> {
  // Bots fill every field; people never see this one.
  if (str(form.get("website"))) return { ok: true };
  const issue = ISSUES.find((i) => i.id === form.get("issue"));
  if (!issue) return { error: "Pick what's wrong." };
  const note = str(form.get("note"))?.slice(0, 2000) ?? null;
  if (issue.id === "other" && !note) return { error: "Tell us a little about what's wrong." };
  const location = await db.location.findUnique({ where: { id: locationId }, include: { parent: true } });
  if (!location) return { error: "This sign's room no longer exists. Please tell a staff member." };

  const ip = await clientIp();
  const now = Date.now();
  const [mine, total] = await Promise.all([
    db.workOrder.count({ where: { reported: true, reporterIp: ip, createdAt: { gt: new Date(now - PER_IP_MINUTES * 60_000) } } }),
    db.workOrder.count({ where: { reported: true, createdAt: { gt: new Date(now - 3600_000) } } }),
  ]);
  if (mine >= PER_IP_LIMIT || total >= GLOBAL_HOURLY_LIMIT) return { error: "Thanks, we've had a lot of reports just now. Please tell a staff member." };

  let photo: Awaited<ReturnType<typeof saveUpload>> = null;
  try {
    const f = form.get("photo");
    if (f instanceof File) photo = await saveUpload(f);
  } catch {
    return { error: "That photo couldn't be used. Try a JPEG or PNG, or skip the photo." };
  }

  const name = str(form.get("name"))?.slice(0, 100) ?? null;
  const contact = str(form.get("contact"))?.slice(0, 200) ?? null;
  const where = location.parent ? `${location.parent.name} › ${location.name}` : location.name;
  const title = `${issue.label} – ${location.name}`;
  const reporter = [name, contact].filter(Boolean).join(", ") || "someone (no name given)";

  // The same problem in the same room, still open from the last day: add to it instead of opening another.
  const existing = await db.workOrder.findFirst({
    where: { reported: true, locationId, title, status: { not: "DONE" }, createdAt: { gt: new Date(now - 86_400_000) } },
  });
  if (existing) {
    await db.comment.create({ data: { workOrderId: existing.id, body: `Reported again by ${reporter}.${note ? `\n${note}` : ""}` } });
    if (photo) await db.attachment.create({ data: { ...photo, workOrderId: existing.id } });
    return { ok: true };
  }

  const wo = await db.workOrder.create({
    data: {
      title,
      description: [`Reported from the QR sign in ${where}.`, note].filter(Boolean).join("\n\n"),
      priority: issue.priority,
      type: "REACTIVE",
      locationId,
      categories: ["Reported"],
      reported: true,
      reporterName: name,
      reporterContact: contact,
      reporterIp: ip,
      attachments: photo ? { create: photo } : undefined,
    },
  });
  await alertAdmins({
    title: `${issue.priority === "HIGH" ? "Urgent: " : ""}${issue.label}`,
    body: `${where}${note ? ` — ${note.slice(0, 140)}` : ""}`,
    path: `/work-orders/${wo.number}`,
  });
  return { ok: true };
}
