"use server";

import { redirect } from "next/navigation";
import type { ChecklistItemKind } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { str } from "@/lib/format";

const KINDS: ChecklistItemKind[] = ["CHECKBOX", "PASS_FAIL", "NUMBER", "TEXT"];

export async function createChecklist(form: FormData) {
  await requireUser("ADMIN");
  const name = str(form.get("name"));
  if (!name) return;
  const t = await db.checklistTemplate.create({ data: { name } });
  redirect(`/checklists/${t.id}`);
}

// The form posts every row as label[]/kind[]; rows left blank are dropped and the rest are renumbered.
// Work orders already created keep their own copy of the items, so editing a template never changes history.
export async function saveChecklist(id: string, form: FormData) {
  await requireUser("ADMIN");
  const labels = form.getAll("label").map((v) => String(v).trim());
  const kinds = form.getAll("kind").map(String);
  const items = labels
    .map((label, i) => ({ label, kind: (KINDS.includes(kinds[i] as ChecklistItemKind) ? kinds[i] : "CHECKBOX") as ChecklistItemKind }))
    .filter((x) => x.label);
  await db.$transaction([
    db.checklistTemplate.update({ where: { id }, data: { name: str(form.get("name")) ?? "Checklist" } }),
    db.checklistItem.deleteMany({ where: { templateId: id } }),
    db.checklistItem.createMany({ data: items.map((x, position) => ({ ...x, position, templateId: id })) }),
  ]);
  redirect(`/checklists/${id}`);
}

export async function deleteChecklist(id: string) {
  await requireUser("ADMIN");
  await db.$transaction([
    db.pmSchedule.updateMany({ where: { checklistId: id }, data: { checklistId: null } }),
    db.workOrder.updateMany({ where: { checklistId: id }, data: { checklistId: null } }),
    db.checklistTemplate.delete({ where: { id } }),
  ]);
  redirect("/checklists");
}
