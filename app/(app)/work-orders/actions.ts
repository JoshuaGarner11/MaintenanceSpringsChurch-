"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Priority, WorkStatus, WorkType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dollarsToCents, fromDateInput, int, str } from "@/lib/format";
import { saveUpload } from "@/lib/uploads";

const PRIORITIES: Priority[] = ["NONE", "LOW", "MEDIUM", "HIGH"];
const STATUSES: WorkStatus[] = ["OPEN", "IN_PROGRESS", "ON_HOLD", "DONE"];

function readDetails(form: FormData) {
  const priority = String(form.get("priority"));
  const type = form.get("type") === "PREVENTIVE" ? "PREVENTIVE" : "REACTIVE";
  return {
    title: str(form.get("title")) ?? "Untitled",
    description: str(form.get("description")),
    priority: (PRIORITIES.includes(priority as Priority) ? priority : "NONE") as Priority,
    type: type as WorkType,
    dueDate: fromDateInput(form.get("dueDate")),
    locationId: str(form.get("locationId")),
    assetId: str(form.get("assetId")),
    vendorId: str(form.get("vendorId")),
    categories: (str(form.get("categories")) ?? "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean),
  };
}

async function attachFiles(form: FormData, target: { workOrderId: string }) {
  for (const f of form.getAll("photos")) {
    if (!(f instanceof File)) continue;
    const saved = await saveUpload(f);
    if (saved) await db.attachment.create({ data: { ...saved, ...target } });
  }
}

export async function createWorkOrder(form: FormData) {
  const user = await requireUser("ADMIN", "TECHNICIAN");
  const details = readDetails(form);
  const checklistId = str(form.get("checklistId"));
  const items = checklistId
    ? await db.checklistItem.findMany({ where: { templateId: checklistId }, orderBy: { position: "asc" } })
    : [];
  // Technicians who log a job are assigned to it unless they pick someone else.
  const assigneeIds = form.getAll("assigneeIds").map(String).filter(Boolean);
  if (assigneeIds.length === 0 && user.role === "TECHNICIAN") assigneeIds.push(user.id);
  const wo = await db.workOrder.create({
    data: {
      ...details,
      checklistId,
      createdById: user.id,
      followUpOfId: str(form.get("followUpOfId")),
      assignees: { create: assigneeIds.map((userId) => ({ userId })) },
      answers: { create: items.map((i) => ({ label: i.label, kind: i.kind, position: i.position })) },
    },
  });
  await attachFiles(form, { workOrderId: wo.id });
  revalidatePath("/");
  redirect(`/work-orders/${wo.number}`);
}

export async function updateWorkOrder(id: string, form: FormData) {
  await requireUser("ADMIN", "TECHNICIAN");
  const assigneeIds = form.getAll("assigneeIds").map(String).filter(Boolean);
  const wo = await db.workOrder.update({
    where: { id },
    data: {
      ...readDetails(form),
      assignees: { deleteMany: {}, create: assigneeIds.map((userId) => ({ userId })) },
    },
  });
  redirect(`/work-orders/${wo.number}`);
}

export async function setStatus(id: string, status: WorkStatus) {
  const user = await requireUser("ADMIN", "TECHNICIAN");
  if (!STATUSES.includes(status)) return;
  const wo = await db.workOrder.update({
    where: { id },
    data:
      status === "DONE"
        ? { status, completedAt: new Date(), completedById: user.id }
        : { status, completedAt: null, completedById: null },
  });
  revalidatePath(`/work-orders/${wo.number}`);
}

export async function completeWorkOrder(id: string, form: FormData) {
  const user = await requireUser("ADMIN", "TECHNICIAN");
  const hours = Number(str(form.get("hours")) ?? 0);
  const wo = await db.workOrder.update({
    where: { id },
    data: {
      status: "DONE",
      completedAt: new Date(),
      completedById: user.id,
      minutesSpent: Number.isFinite(hours) ? Math.round(hours * 60) : 0,
      otherCostCents: dollarsToCents(form.get("otherCost")) ?? 0,
    },
  });
  const note = str(form.get("note"));
  if (note) await db.comment.create({ data: { workOrderId: id, userId: user.id, body: note } });
  revalidatePath("/");
  revalidatePath(`/work-orders/${wo.number}`);
}

export async function saveChecklist(id: string, form: FormData) {
  await requireUser("ADMIN", "TECHNICIAN");
  const answers = await db.checklistAnswer.findMany({ where: { workOrderId: id } });
  await db.$transaction(
    answers.map((a) =>
      db.checklistAnswer.update({
        where: { id: a.id },
        data: {
          value: a.kind === "CHECKBOX" ? (form.get(`value-${a.id}`) ? "yes" : null) : str(form.get(`value-${a.id}`)),
          note: str(form.get(`note-${a.id}`)),
        },
      }),
    ),
  );
  const wo = await db.workOrder.findUniqueOrThrow({ where: { id }, select: { number: true, status: true } });
  if (wo.status === "OPEN") await db.workOrder.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  revalidatePath(`/work-orders/${wo.number}`);
}

// A failed inspection item becomes its own repair order, linked back to the inspection.
export async function createFollowUp(id: string) {
  const user = await requireUser("ADMIN", "TECHNICIAN");
  const wo = await db.workOrder.findUniqueOrThrow({
    where: { id },
    include: { answers: true, assignees: true },
  });
  const failed = wo.answers.filter((a) => a.value === "FAIL" || a.value === "FLAG");
  const repair = await db.workOrder.create({
    data: {
      title: `Repair: ${wo.title}`,
      description: [
        `Follow-up from #${wo.number}.`,
        ...failed.map((a) => `• ${a.label}: ${a.value}${a.note ? ` (${a.note})` : ""}`),
      ].join("\n"),
      priority: "HIGH",
      type: "REACTIVE",
      assetId: wo.assetId,
      locationId: wo.locationId,
      vendorId: wo.vendorId,
      followUpOfId: wo.id,
      createdById: user.id,
      assignees: { create: wo.assignees.map((a) => ({ userId: a.userId })) },
    },
  });
  redirect(`/work-orders/${repair.number}`);
}

export async function addComment(id: string, form: FormData) {
  const user = await requireUser("ADMIN", "TECHNICIAN");
  const body = str(form.get("body"));
  if (body) await db.comment.create({ data: { workOrderId: id, userId: user.id, body } });
  await attachFiles(form, { workOrderId: id });
  const wo = await db.workOrder.findUniqueOrThrow({ where: { id }, select: { number: true } });
  revalidatePath(`/work-orders/${wo.number}`);
}

export async function logPartUsed(id: string, form: FormData) {
  await requireUser("ADMIN", "TECHNICIAN");
  const partId = str(form.get("partId"));
  const quantity = int(form.get("quantity"), 1);
  if (!partId || quantity <= 0) return;
  await db.$transaction([
    db.partUsage.create({ data: { workOrderId: id, partId, quantity } }),
    db.part.update({ where: { id: partId }, data: { inStock: { decrement: quantity } } }),
  ]);
  const wo = await db.workOrder.findUniqueOrThrow({ where: { id }, select: { number: true } });
  revalidatePath(`/work-orders/${wo.number}`);
}

export async function undoPartUsage(usageId: string) {
  await requireUser("ADMIN", "TECHNICIAN");
  const usage = await db.partUsage.findUniqueOrThrow({ where: { id: usageId }, include: { workOrder: true } });
  await db.$transaction([
    db.partUsage.delete({ where: { id: usageId } }),
    db.part.update({ where: { id: usage.partId }, data: { inStock: { increment: usage.quantity } } }),
  ]);
  revalidatePath(`/work-orders/${usage.workOrder.number}`);
}

export async function deleteWorkOrder(id: string) {
  await requireUser("ADMIN");
  await db.workOrder.delete({ where: { id } });
  redirect("/work-orders");
}
