// Runs alongside the app. Once an hour it turns due schedules into work orders,
// and once a day (at DIGEST_HOUR, server time) it emails admins a short digest.
import { PrismaClient } from "@prisma/client";
import { generateDueWorkOrders } from "../lib/pm";
import { sendMail } from "../lib/mail";

const db = new PrismaClient();
const DIGEST_HOUR = Number(process.env.DIGEST_HOUR ?? 7);
let lastDigest = "";

async function digest() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [overdue, lowStock, admins] = await Promise.all([
    db.workOrder.findMany({ where: { status: { not: "DONE" }, dueDate: { lt: today } }, orderBy: { dueDate: "asc" } }),
    db.$queryRaw<{ name: string; inStock: number; minimum: number }[]>`SELECT name, "inStock", minimum FROM "Part" WHERE "inStock" < minimum ORDER BY name`,
    db.user.findMany({ where: { role: "ADMIN", active: true } }),
  ]);
  if (overdue.length === 0 && lowStock.length === 0) return;
  const url = process.env.APP_URL ?? "";
  const lines = [
    ...(overdue.length ? ["Overdue work:", ...overdue.map((w) => `  #${w.number} ${w.title} (due ${w.dueDate?.toISOString().slice(0, 10)})`), ""] : []),
    ...(lowStock.length ? ["Parts below minimum:", ...lowStock.map((p) => `  ${p.name}: ${p.inStock} left, minimum ${p.minimum}`), ""] : []),
    url,
  ];
  for (const a of admins) await sendMail(a.email, `Maintenance: ${overdue.length} overdue, ${lowStock.length} low on stock`, lines.join("\n"));
}

async function tick() {
  try {
    const created = await generateDueWorkOrders(db);
    if (created.length) console.log(`[scheduler] created work orders ${created.map((n) => `#${n}`).join(", ")}`);
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    if (now.getHours() >= DIGEST_HOUR && lastDigest !== day) {
      lastDigest = day;
      await digest();
    }
  } catch (e) {
    console.error("[scheduler]", e);
  }
}

console.log("[scheduler] started");
tick();
setInterval(tick, 60 * 60 * 1000);
