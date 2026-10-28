"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Priority, RepeatUnit } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fromDateInput, int, str } from "@/lib/format";
import { generateDueWorkOrders } from "@/lib/pm";

function readSchedule(form: FormData) {
  const unit = String(form.get("unit"));
  const priority = String(form.get("priority"));
  return {
    title: str(form.get("title")) ?? "Untitled schedule",
    description: str(form.get("description")),
    every: Math.max(1, int(form.get("every"), 1)),
    unit: (["DAY", "WEEK", "MONTH", "YEAR"].includes(unit) ? unit : "YEAR") as RepeatUnit,
    leadDays: Math.max(0, int(form.get("leadDays"), 14)),
    nextDue: fromDateInput(form.get("nextDue")) ?? new Date(),
    priority: (["NONE", "LOW", "MEDIUM", "HIGH"].includes(priority) ? priority : "MEDIUM") as Priority,
    assetId: str(form.get("assetId")),
    locationId: str(form.get("locationId")),
    vendorId: str(form.get("vendorId")),
    assigneeId: str(form.get("assigneeId")),
    checklistId: str(form.get("checklistId")),
    categories: (str(form.get("categories")) ?? "").split(",").map((c) => c.trim()).filter(Boolean),
    active: form.get("active") !== "off",
  };
}

export async function createSchedule(form: FormData) {
  await requireUser("ADMIN");
  const s = await db.pmSchedule.create({ data: readSchedule(form) });
  await generateDueWorkOrders(db);
  redirect(`/schedules/${s.id}`);
}

export async function updateSchedule(id: string, form: FormData) {
  await requireUser("ADMIN");
  await db.pmSchedule.update({ where: { id }, data: readSchedule(form) });
  await generateDueWorkOrders(db);
  revalidatePath(`/schedules/${id}`);
  redirect(`/schedules/${id}`);
}

export async function deleteSchedule(id: string) {
  await requireUser("ADMIN");
  await db.$transaction([
    db.workOrder.updateMany({ where: { scheduleId: id }, data: { scheduleId: null } }),
    db.pmSchedule.delete({ where: { id } }),
  ]);
  redirect("/schedules");
}
