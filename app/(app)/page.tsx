import Link from "next/link";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { btn, Empty, List, PageHeader, Section } from "@/components/ui";
import { startOfDay, WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUser();
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const weekEnd = new Date(today.getTime() + 8 * 86_400_000);
  const mine = user.role === "TECHNICIAN" ? { assignees: { some: { userId: user.id } } } : {};

  const open = await db.workOrder.findMany({
    where: { status: { not: "DONE" }, ...mine },
    include: workOrderRowInclude,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { number: "asc" }],
  });

  const overdue = open.filter((w) => w.dueDate && w.dueDate < today);
  const dueToday = open.filter((w) => w.dueDate && w.dueDate >= today && w.dueDate < tomorrow);
  const thisWeek = open.filter((w) => w.dueDate && w.dueDate >= tomorrow && w.dueDate < weekEnd);
  const noDate = open.filter((w) => !w.dueDate);
  const later = open.length - overdue.length - dueToday.length - thisWeek.length - noDate.length;

  const lowStock = canEdit(user)
    ? await db.$queryRaw<{ id: string; name: string; inStock: number; minimum: number }[]>`
        SELECT id, name, "inStock", minimum FROM "Part" WHERE "inStock" < minimum ORDER BY name`
    : [];

  const group = (title: string, rows: typeof open) =>
    rows.length > 0 && (
      <Section title={`${title} (${rows.length})`}>
        <List>
          {rows.map((w) => (
            <WorkOrderRow key={w.id} wo={w} now={now} />
          ))}
        </List>
      </Section>
    );

  return (
    <>
      <PageHeader
        title={`Hi ${user.name.split(" ")[0]}`}
        action={canEdit(user) && <Link href="/work-orders/new" className={btn}>+ New</Link>}
      />
      {open.length === 0 && <Empty>Nothing open{user.role === "TECHNICIAN" ? " assigned to you" : ""}. Nice.</Empty>}
      {group("Overdue", overdue)}
      {group("Due today", dueToday)}
      {group("Due this week", thisWeek)}
      {group("No due date", noDate)}
      {later > 0 && (
        <p className="mb-6 text-sm text-slate-500">
          {later} more due later. <Link href="/work-orders" className="text-brand-700 underline">See all work orders</Link>
        </p>
      )}
      {lowStock.length > 0 && (
        <Section title="Low stock" action={<Link href="/parts" className="text-sm text-brand-700">Parts</Link>}>
          <List>
            {lowStock.map((p) => (
              <Link key={p.id} href={`/parts/${p.id}`} className="flex justify-between border-b border-slate-100 px-4 py-3 last:border-0">
                <span>{p.name}</span>
                <span className="text-sm text-red-700">{p.inStock} left · min {p.minimum}</span>
              </Link>
            ))}
          </List>
        </Section>
      )}
    </>
  );
}
