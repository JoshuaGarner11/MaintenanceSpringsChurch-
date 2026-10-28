"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dollarsToCents, int, str } from "@/lib/format";

function readPart(form: FormData) {
  return {
    name: str(form.get("name")) ?? "Unnamed part",
    description: str(form.get("description")),
    area: str(form.get("area")),
    locationId: str(form.get("locationId")),
    vendorId: str(form.get("vendorId")),
    minimum: int(form.get("minimum")),
    unitCostCents: dollarsToCents(form.get("unitCost")),
    leadTimeDays: str(form.get("leadTimeDays")) ? int(form.get("leadTimeDays")) : null,
    critical: form.get("critical") === "on",
  };
}

export async function createPart(form: FormData) {
  await requireUser("ADMIN");
  const part = await db.part.create({ data: { ...readPart(form), inStock: int(form.get("inStock")) } });
  redirect(`/parts/${part.id}`);
}

export async function updatePart(id: string, form: FormData) {
  await requireUser("ADMIN");
  await db.part.update({ where: { id }, data: readPart(form) });
  revalidatePath(`/parts/${id}`);
}

// Restocking adds to the count; a stock count sets it outright.
export async function adjustStock(id: string, form: FormData) {
  await requireUser("ADMIN", "TECHNICIAN");
  const amount = int(form.get("amount"));
  const data = form.get("mode") === "count" ? { inStock: amount } : { inStock: { increment: amount } };
  await db.part.update({ where: { id }, data });
  revalidatePath(`/parts/${id}`);
}

export async function deletePart(id: string) {
  await requireUser("ADMIN");
  await db.$transaction([db.partUsage.deleteMany({ where: { partId: id } }), db.part.delete({ where: { id } })]);
  redirect("/parts");
}

function readVendor(form: FormData) {
  return {
    name: str(form.get("name")) ?? "Unnamed vendor",
    contactName: str(form.get("contactName")),
    email: str(form.get("email")),
    phone: str(form.get("phone")),
    notes: str(form.get("notes")),
  };
}

export async function createVendor(form: FormData) {
  await requireUser("ADMIN");
  await db.vendor.create({ data: readVendor(form) });
  revalidatePath("/vendors");
}

export async function updateVendor(id: string, form: FormData) {
  await requireUser("ADMIN");
  await db.vendor.update({ where: { id }, data: readVendor(form) });
  redirect("/vendors");
}

export async function deleteVendor(id: string) {
  await requireUser("ADMIN");
  await db.$transaction([
    db.asset.updateMany({ where: { vendorId: id }, data: { vendorId: null } }),
    db.part.updateMany({ where: { vendorId: id }, data: { vendorId: null } }),
    db.workOrder.updateMany({ where: { vendorId: id }, data: { vendorId: null } }),
    db.pmSchedule.updateMany({ where: { vendorId: id }, data: { vendorId: null } }),
    db.vendor.delete({ where: { id } }),
  ]);
  redirect("/vendors");
}
