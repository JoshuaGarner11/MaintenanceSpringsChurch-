"use server";

import { redirect } from "next/navigation";
import type { AssetStatus, Criticality } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { str } from "@/lib/format";
import { saveUpload } from "@/lib/uploads";

function readAsset(form: FormData) {
  const crit = String(form.get("criticality"));
  return {
    name: str(form.get("name")) ?? "Unnamed asset",
    description: str(form.get("description")),
    type: str(form.get("type")),
    criticality: (["NORMAL", "IMPORTANT", "CRITICAL"].includes(crit) ? crit : "NORMAL") as Criticality,
    status: (form.get("status") === "DOWN" ? "DOWN" : "WORKING") as AssetStatus,
    manufacturer: str(form.get("manufacturer")),
    model: str(form.get("model")),
    serialNumber: str(form.get("serialNumber")),
    year: str(form.get("year")),
    locationId: str(form.get("locationId")),
    parentId: str(form.get("parentId")),
    vendorId: str(form.get("vendorId")),
  };
}

async function attachPhotos(form: FormData, assetId: string) {
  for (const f of form.getAll("photos")) {
    if (!(f instanceof File)) continue;
    const saved = await saveUpload(f);
    if (saved) await db.attachment.create({ data: { ...saved, assetId } });
  }
}

export async function createAsset(form: FormData) {
  const user = await requireUser("ADMIN", "TECHNICIAN");
  // Assets added by technicians wait for an admin to check them.
  const asset = await db.asset.create({ data: { ...readAsset(form), needsReview: user.role !== "ADMIN" } });
  await attachPhotos(form, asset.id);
  redirect(`/assets/${asset.id}`);
}

export async function updateAsset(id: string, form: FormData) {
  await requireUser("ADMIN", "TECHNICIAN");
  const data = readAsset(form);
  if (data.parentId === id) data.parentId = null;
  await db.asset.update({ where: { id }, data });
  await attachPhotos(form, id);
  redirect(`/assets/${id}`);
}

export async function approveAsset(id: string) {
  await requireUser("ADMIN");
  await db.asset.update({ where: { id }, data: { needsReview: false } });
  redirect(`/assets/${id}`);
}

export async function deleteAsset(id: string) {
  await requireUser("ADMIN");
  await db.$transaction([
    db.asset.updateMany({ where: { parentId: id }, data: { parentId: null } }),
    db.workOrder.updateMany({ where: { assetId: id }, data: { assetId: null } }),
    db.pmSchedule.updateMany({ where: { assetId: id }, data: { assetId: null } }),
    db.asset.delete({ where: { id } }),
  ]);
  redirect("/assets");
}
