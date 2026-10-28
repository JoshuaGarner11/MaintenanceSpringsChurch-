// Imports a MaintainX CSV export into an empty database.
//
//   npm run import:maintainx -- /path/to/export-folder [--users users.json]
//
// The folder holds the CSVs exactly as MaintainX names them (Locations.csv, Assets.csv,
// Parts.csv, Vendors.csv, "Work Orders - <dates>.csv"). MaintainX doesn't export people's
// email addresses, so pass --users with {"Vladz": {"email": "...", "role": "ADMIN"}, ...}
// or fix the placeholder addresses afterwards on the People page.
//
// Photos and PDFs stay on MaintainX's servers until you run `npm run download:files`.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { parseAnswer } from "../lib/maintainx";
import { PrismaClient, type ChecklistItemKind, type Criticality, type Priority, type Role, type WorkStatus } from "@prisma/client";

type Row = Record<string, string>;

const db = new PrismaClient();
const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const usersFile = args.includes("--users") ? args[args.indexOf("--users") + 1] : undefined;
if (!dir) {
  console.error("Usage: npm run import:maintainx -- <export folder> [--users users.json]");
  process.exit(1);
}

// People who appear in the export but aren't church users (MaintainX's onboarding trainer).
const SKIP_PEOPLE = new Set(["Erin Patterson"]);
// MaintainX's sample vendors start with "*".
const isSampleVendor = (name: string) => name.trim().startsWith("*");
// Generic procedure names get the work order's description instead.
const GENERIC_PROCEDURES = new Set(["Procedure", "Standard Operating Procedure"]);

function readCsv(prefix: string): Row[] {
  const file = readdirSync(dir!).find((f) => f.replace(/^[0-9a-f]+-/, "").replace(/_/g, " ").startsWith(prefix));
  if (!file) {
    console.warn(`  (no ${prefix} file, skipping)`);
    return [];
  }
  return parse(readFileSync(path.join(dir!, file)), { columns: true, bom: true, skip_empty_lines: true, relax_column_count: true });
}

const blank = (s: string | undefined) => (s ?? "").trim() === "";
const val = (s: string | undefined) => (blank(s) ? null : s!.trim());
const list = (s: string | undefined) => (blank(s) ? [] : s!.split("|").map((x) => x.trim()).filter(Boolean));
const date = (s: string | undefined) => {
  if (blank(s)) return null;
  const d = new Date(s!.trim().replace(" ", "T") + (s!.includes(":") ? "Z" : "T12:00:00Z"));
  return Number.isNaN(d.getTime()) ? null : d;
};
const cents = (s: string | undefined) => {
  const n = Number((s ?? "").replace(/[$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};
const minutes = (s: string | undefined) => {
  const m = /^(\d+):(\d{2}):(\d{2})$/.exec((s ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
const mime = (url: string) =>
  url.toLowerCase().endsWith(".pdf") ? "application/pdf" : url.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
const fileName = (url: string) => decodeURIComponent(url.split("/").pop() ?? "file").replace(/^[0-9a-f-]{36}_/, "");

async function main() {
  const existing = await db.workOrder.count();
  if (existing > 0) {
    console.error(`The database already has ${existing} work orders. Import only runs on an empty database.`);
    process.exit(1);
  }

  // People
  const userMap: Record<string, { email: string; role?: Role }> = usersFile ? JSON.parse(readFileSync(usersFile, "utf8")) : {};
  const workOrders = readCsv("Work Orders");
  const names = new Set<string>();
  for (const w of workOrders) for (const n of [...list(w["Assigned to"]), w["Created by"], w["Completed by"]]) if (!blank(n)) names.add(n.trim());
  const users = new Map<string, string>();
  for (const name of names) {
    if (SKIP_PEOPLE.has(name)) continue;
    const given = userMap[name];
    const email = (given?.email ?? `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@change-me.invalid`).toLowerCase();
    const u = await db.user.upsert({
      where: { email },
      update: {},
      create: { name, email, role: given?.role ?? "TECHNICIAN", active: Boolean(given) },
    });
    users.set(name, u.id);
  }
  console.log(`People: ${users.size}${usersFile ? "" : " (inactive, with placeholder emails; set their emails on the People page)"}`);

  // Vendors
  const vendorsById = new Map<string, string>();
  const vendorsByName = new Map<string, string>();
  for (const v of readCsv("Vendors")) {
    if (isSampleVendor(v["Vendor"])) continue;
    const created = await db.vendor.create({
      data: {
        name: v["Vendor"].trim(),
        contactName: val(v["Contact Name"]),
        email: val(v["Email"]),
        phone: val(v["Phone Number"]),
        notes: [val(v["Role"]), val(v["Description"])].filter(Boolean).join(" · ") || null,
        maintainxId: v["ID"],
      },
    });
    vendorsById.set(v["ID"], created.id);
    vendorsByName.set(created.name.toLowerCase(), created.id);
  }
  console.log(`Vendors: ${vendorsById.size}`);

  // Locations: create all, then link parents.
  const locationRows = readCsv("Locations");
  const locById = new Map<string, string>();
  for (const l of locationRows) {
    const created = await db.location.create({
      data: { name: l["Name"].trim(), description: val(l["Description"]), qrCode: val(l["QR/Bar code"]), maintainxId: l["ID"] },
    });
    locById.set(l["ID"], created.id);
    for (const url of list(l["Attachments"]).length ? list(l["Attachments"]) : list(l["Thumbnail"])) {
      await db.attachment.create({ data: { locationId: created.id, sourceUrl: url, fileName: fileName(url), mimeType: mime(url) } });
    }
  }
  for (const l of locationRows) {
    if (!blank(l["Parent ID"]) && locById.has(l["Parent ID"])) {
      await db.location.update({ where: { id: locById.get(l["ID"])! }, data: { parentId: locById.get(l["Parent ID"]) } });
    }
  }
  // Assets and parts name their location; prefer a top-level area when a room name repeats.
  const locByName = new Map<string, string>();
  for (const l of [...locationRows].sort((a, b) => Number(blank(b["Parent ID"])) - Number(blank(a["Parent ID"])))) {
    if (!locByName.has(l["Name"].trim().toLowerCase())) locByName.set(l["Name"].trim().toLowerCase(), locById.get(l["ID"])!);
  }
  const locationFor = (name: string | undefined) => (blank(name) ? null : (locByName.get(name!.trim().toLowerCase()) ?? null));
  console.log(`Locations: ${locById.size}`);

  // Assets: create all, then link parents by name.
  const assetRows = readCsv("Assets");
  const assetById = new Map<string, string>();
  const assetByName = new Map<string, string>();
  for (const a of assetRows) {
    const crit = (a["Criticality"] ?? "").toUpperCase();
    const created = await db.asset.create({
      data: {
        name: a["Name"].trim(),
        description: val(a["Description"]),
        type: list(a["Types"]).join(", ") || null,
        criticality: (["IMPORTANT", "CRITICAL"].includes(crit) ? crit : "NORMAL") as Criticality,
        status: (a["Status"] ?? "").toLowerCase() === "offline" ? "DOWN" : "WORKING",
        manufacturer: val(a["Manufacturer"]),
        model: val(a["Model"]),
        serialNumber: val(a["Serial Number"]),
        year: val(a["Year"]),
        barcode: val(a["Barcode"]),
        locationId: locationFor(a["Location"]),
        vendorId: list(a["Vendors"]).map((n) => vendorsByName.get(n.toLowerCase())).find(Boolean) ?? null,
        maintainxId: a["ID"],
      },
    });
    assetById.set(a["ID"], created.id);
    assetByName.set(created.name.toLowerCase(), created.id);
    for (const url of list(a["Attachments"]).length ? list(a["Attachments"]) : list(a["Thumbnail"])) {
      await db.attachment.create({ data: { assetId: created.id, sourceUrl: url, fileName: fileName(url), mimeType: mime(url) } });
    }
  }
  for (const a of assetRows) {
    const parent = assetByName.get((a["Parent"] ?? "").trim().toLowerCase());
    if (parent) await db.asset.update({ where: { id: assetById.get(a["ID"])! }, data: { parentId: parent } });
  }
  console.log(`Assets: ${assetById.size}`);

  // Parts
  let parts = 0;
  for (const p of readCsv("Parts")) {
    let inStock = Number(p["Quantity in Stock"]) || 0;
    if (inStock < 0) {
      console.warn(`  ${p["Name"]}: stock was ${inStock} in MaintainX, imported as 0. Count it and correct in the app.`);
      inStock = 0;
    }
    const assetIds = list(p["Assets"]).map((n) => assetByName.get(n.toLowerCase())).filter((x): x is string => Boolean(x));
    await db.part.create({
      data: {
        name: p["Name"].trim(),
        description: val(p["Description"]),
        area: val(p["Area"]),
        locationId: locationFor(p["Location"]),
        inStock,
        minimum: Number(p["Minimum Quantity"]) || 0,
        unitCostCents: blank(p["Unit Cost"]) ? null : cents(p["Unit Cost"]),
        leadTimeDays: blank(p["Lead Time"]) ? null : Number(p["Lead Time"]),
        critical: list(p["Types"]).some((t) => t.toLowerCase() === "critical"),
        vendorId: list(p["Vendors"]).map((n) => vendorsByName.get(n.toLowerCase())).find(Boolean) ?? null,
        assets: { connect: assetIds.map((id) => ({ id })) },
        maintainxId: p["ID"],
      },
    });
    parts++;
  }
  console.log(`Parts: ${parts}`);

  // Checklist templates, built from the questions that were actually answered on each procedure.
  const kept = workOrders.filter((w) => !list(w["Categories"]).includes("Training"));
  const templateName = (w: Row) =>
    blank(w["Procedure Name"]) ? null : GENERIC_PROCEDURES.has(w["Procedure Name"].trim()) ? (val(w["Procedure Description"]) ?? w["Title"].trim()) : w["Procedure Name"].trim();
  const questionsOf = (w: Row) => {
    const out: { label: string; answer: string }[] = [];
    for (let i = 1; i <= 50 && `Question ${i}` in w; i++) if (!blank(w[`Question ${i}`])) out.push({ label: w[`Question ${i}`].trim(), answer: w[`Answer ${i}`] ?? "" });
    return out;
  };
  const templates = new Map<string, { id: string; items: { label: string; kind: ChecklistItemKind }[] }>();
  for (const w of kept) {
    const name = templateName(w);
    if (!name || templates.has(name)) continue;
    const answered = new Map<string, ChecklistItemKind>();
    for (const other of kept.filter((o) => templateName(o) === name)) {
      for (const q of questionsOf(other)) if (!blank(q.answer) && !answered.has(q.label)) answered.set(q.label, parseAnswer(q.answer).kind);
    }
    // A question never answered anywhere is a section heading, not a check.
    const items = questionsOf(w).filter((q) => answered.has(q.label)).map((q) => ({ label: q.label, kind: answered.get(q.label)! }));
    const t = await db.checklistTemplate.create({
      data: { name, items: { create: items.map((x, position) => ({ ...x, position })) } },
    });
    templates.set(name, { id: t.id, items });
  }
  console.log(`Checklists: ${templates.size}`);

  // Work orders keep their MaintainX numbers.
  const woIdByNumber = new Map<number, string>();
  for (const w of kept) {
    const number = Number(w["ID"]);
    const status = (["OPEN", "IN_PROGRESS", "ON_HOLD", "DONE"].includes(w["Status"]) ? w["Status"] : "OPEN") as WorkStatus;
    const priority = (["LOW", "MEDIUM", "HIGH"].includes(w["Priority"]) ? w["Priority"] : "NONE") as Priority;
    const tName = templateName(w);
    const answers = questionsOf(w)
      .filter((q) => tName && templates.get(tName)?.items.some((i) => i.label === q.label))
      .map((q, position) => {
        const a = parseAnswer(q.answer);
        return { label: q.label, kind: a.kind, value: a.value, note: a.note, position };
      });
    const assignees = list(w["Assigned to"]).map((n) => users.get(n)).filter((x): x is string => Boolean(x));
    const created = await db.workOrder.create({
      data: {
        number,
        title: w["Title"].trim(),
        description: val(w["Description"]),
        type: w["Work Type"] === "PREVENTIVE" ? "PREVENTIVE" : "REACTIVE",
        priority,
        status,
        categories: list(w["Categories"]),
        dueDate: date(w["Due date"]),
        locationId: locById.get(w["Location ID"]) ?? null,
        assetId: assetById.get(w["Asset ID"]) ?? null,
        vendorId: list(w["Vendor IDs"]).map((id) => vendorsById.get(id)).find(Boolean) ?? null,
        checklistId: tName ? templates.get(tName)!.id : null,
        minutesSpent: minutes(w["Total Reported Time"]),
        otherCostCents: cents(w["Additional Costs"]),
        createdById: users.get(w["Created by"]) ?? null,
        completedById: status === "DONE" ? (users.get(w["Completed by"]) ?? null) : null,
        completedAt: status === "DONE" ? date(w["Completed on"]) : null,
        createdAt: date(w["Created on"]) ?? new Date(),
        maintainxId: w["Global ID"] || null,
        assignees: { create: [...new Set(assignees)].map((userId) => ({ userId })) },
        answers: { create: answers },
        attachments: { create: list(w["Attachments"]).map((url) => ({ sourceUrl: url, fileName: fileName(url), mimeType: mime(url) })) },
      },
    });
    woIdByNumber.set(number, created.id);
  }
  await db.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"WorkOrder"', 'number'), (SELECT MAX(number) FROM "WorkOrder"))`);
  console.log(`Work orders: ${woIdByNumber.size} (skipped ${workOrders.length - kept.length} MaintainX training orders)`);

  // An asset whose latest inspection failed gets an open repair order, unless one already followed it.
  const inspected = await db.workOrder.findMany({
    where: { assetId: { not: null }, answers: { some: { kind: "PASS_FAIL", value: { not: null } } } },
    include: { answers: true, assignees: true },
    orderBy: [{ dueDate: "asc" }, { number: "asc" }],
  });
  const latestByAsset = new Map<string, (typeof inspected)[number]>();
  for (const w of inspected) latestByAsset.set(w.assetId!, w);
  let repairs = 0;
  for (const w of latestByAsset.values()) {
    const failed = w.answers.filter((a) => a.value === "FAIL" || a.value === "FLAG");
    if (failed.length === 0) continue;
    const laterWork = await db.workOrder.count({ where: { assetId: w.assetId, number: { gt: w.number }, type: "REACTIVE" } });
    if (laterWork > 0) continue;
    const r = await db.workOrder.create({
      data: {
        title: `Repair: ${w.title}`,
        description: `Imported from MaintainX: #${w.number} failed (${failed.map((a) => a.label).join(", ")}) with no repair order logged. Close this once the repair is confirmed.`,
        priority: "HIGH",
        assetId: w.assetId,
        locationId: w.locationId,
        vendorId: w.vendorId,
        followUpOfId: w.id,
        assignees: { create: w.assignees.map((a) => ({ userId: a.userId })) },
      },
    });
    console.log(`  Open repair #${r.number} created for failed #${w.number} ${w.title}`);
    repairs++;
  }

  // Yearly safety inspections become repeating schedules, one per asset, due each April.
  const inspections = kept.filter((w) => !blank(w["Asset ID"]) && /inspection|testing/i.test(w["Title"]) && /annual/i.test(`${w["Title"]} ${w["Description"]} ${w["Procedure Description"]}`));
  const annualAssets = new Map<string, Row>();
  for (const w of inspections) annualAssets.set(w["Asset ID"], w);
  for (const w of kept) if (w["Recurrence"]?.startsWith("Yearly") && !blank(w["Asset ID"])) annualAssets.set(w["Asset ID"], w);
  const now = new Date();
  const nextApril = new Date(Date.UTC(now.getUTCMonth() >= 3 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(), 3, 15, 12));
  const vlad = [...users.entries()].find(([n]) => /^vlad/i.test(n))?.[1] ?? null;
  for (const w of annualAssets.values()) {
    const tName = templateName(w);
    await db.pmSchedule.create({
      data: {
        title: w["Title"].trim().replace(/^Annual\s+/i, "Annual "),
        description: val(w["Description"]),
        every: 1,
        unit: "YEAR",
        leadDays: 30,
        nextDue: nextApril,
        priority: "HIGH",
        assetId: assetById.get(w["Asset ID"]) ?? null,
        locationId: locById.get(w["Location ID"]) ?? null,
        vendorId: list(w["Vendor IDs"]).map((id) => vendorsById.get(id)).find(Boolean) ?? null,
        assigneeId: vlad,
        checklistId: tName ? templates.get(tName)!.id : null,
        categories: ["Inspection", "Safety"],
      },
    });
  }
  console.log(`Schedules: ${annualAssets.size} yearly inspections, next due ${nextApril.toISOString().slice(0, 10)}`);
  console.log(`Repairs opened: ${repairs}`);
  console.log(`Files linked (still on MaintainX): ${await db.attachment.count({ where: { storageKey: null } })}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
