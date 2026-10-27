import { db } from "./db";

// Dropdown data shared by the work order, asset, part and schedule forms.
export async function formOptions() {
  const [locations, assets, users, vendors, checklists] = await Promise.all([
    db.location.findMany({ include: { parent: { select: { name: true } } } }),
    db.asset.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { active: true, role: { not: "VIEWER" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.vendor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.checklistTemplate.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const locationOptions = locations
    .map((l) => ({ id: l.id, name: l.parent ? `${l.parent.name} › ${l.name}` : l.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { locations: locationOptions, assets, users, vendors, checklists };
}

export type FormOptions = Awaited<ReturnType<typeof formOptions>>;
