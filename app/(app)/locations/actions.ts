"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { str } from "@/lib/format";

export async function createLocation(form: FormData) {
  await requireUser("ADMIN");
  const name = str(form.get("name"));
  if (!name) return;
  await db.location.create({ data: { name, parentId: str(form.get("parentId")) } });
  revalidatePath("/locations");
}

export async function updateLocation(id: string, form: FormData) {
  await requireUser("ADMIN");
  const parentId = str(form.get("parentId"));
  await db.location.update({
    where: { id },
    data: { name: str(form.get("name")) ?? "Unnamed", description: str(form.get("description")), parentId: parentId === id ? null : parentId },
  });
  revalidatePath(`/locations/${id}`);
}

export async function deleteLocation(id: string) {
  await requireUser("ADMIN");
  const loc = await db.location.findUniqueOrThrow({ where: { id } });
  await db.$transaction([
    db.location.updateMany({ where: { parentId: id }, data: { parentId: loc.parentId } }),
    db.asset.updateMany({ where: { locationId: id }, data: { locationId: loc.parentId } }),
    db.part.updateMany({ where: { locationId: id }, data: { locationId: loc.parentId } }),
    db.workOrder.updateMany({ where: { locationId: id }, data: { locationId: loc.parentId } }),
    db.pmSchedule.updateMany({ where: { locationId: id }, data: { locationId: loc.parentId } }),
    db.location.delete({ where: { id } }),
  ]);
  redirect("/locations");
}
