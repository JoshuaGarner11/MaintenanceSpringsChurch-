import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Card, Empty, List, PageHeader, Section } from "@/components/ui";
import { startOfDay, WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  await requireUser("ADMIN", "VIEWER");
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [open, overdue, doneThisMonth, lowStock, failedInspections, upcoming] = await Promise.all([
    db.workOrder.count({ where: { status: { not: "DONE" } } }),
    db.workOrder.count({ where: { status: { not: "DONE" }, dueDate: { lt: today } } }),
    db.workOrder.count({ where: { status: "DONE", completedAt: { gte: monthStart } } }),
    db.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "Part" WHERE "inStock" < minimum`,
    // Inspections with a failed or flagged item and no repair order opened from them.
    db.workOrder.findMany({
      where: { answers: { some: { value: { in: ["FAIL", "FLAG"] } } }, followUps: { none: {} } },
      include: workOrderRowInclude,
      orderBy: { number: "desc" },
    }),
    db.pmSchedule.findMany({ where: { active: true, nextDue: { lte: new Date(now.getTime() + 60 * 86_400_000) } }, orderBy: { nextDue: "asc" } }),
  ]);
  const tiles: [string, number | string, string, boolean][] = [
    ["Open work orders", open, "/work-orders", false],
    ["Overdue", overdue, "/", overdue > 0],
    ["Done this month", doneThisMonth, "/work-orders?f=done", false],
    ["Parts below minimum", Number(lowStock[0]?.n ?? 0), "/parts", Number(lowStock[0]?.n ?? 0) > 0],
  ];
  return (
    <>
      <PageHeader title="Overview" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map(([text, n, href, alert]) => (
          <Link key={text} href={href}>
            <Card className={alert ? "border-red-200 bg-red-50" : ""}>
              <div className={`text-3xl font-semibold ${alert ? "text-red-700" : ""}`}>{n}</div>
              <div className="text-sm text-slate-600">{text}</div>
            </Card>
          </Link>
        ))}
      </div>
      <Section title="Failed inspections with no repair logged">
        {failedInspections.length === 0 ? <Empty>None. Every failed item has a repair order.</Empty> : <List>{failedInspections.map((w) => <WorkOrderRow key={w.id} wo={w} />)}</List>}
      </Section>
      <Section title="Repeating work in the next 60 days">
        {upcoming.length === 0 ? (
          <Empty>Nothing due.</Empty>
        ) : (
          <Card>
            <ul className="space-y-1 text-sm">
              {upcoming.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <Link className="text-brand-700" href={`/schedules/${s.id}`}>{s.title}</Link>
                  <span className="text-slate-500">{fmtDate(s.nextDue)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>
    </>
  );
}
