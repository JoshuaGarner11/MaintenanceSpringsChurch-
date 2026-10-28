import Link from "next/link";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { Icon, type IconName } from "@/components/icon";
import { btn, Empty, List, PageHeader, Section } from "@/components/ui";
import { startOfDay, WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";

export const dynamic = "force-dynamic";

function greeting(now: Date) {
  const h = Number(now.toLocaleString("en-US", { hour: "numeric", hour12: false }));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Stat({ label, value, icon, tone, href }: { label: string; value: number; icon: IconName; tone: string; href: string }) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border p-3.5 shadow-soft transition hover:-translate-y-0.5 ${value ? tone : "border-slate-200/80 bg-surface text-slate-400"}`}
    >
      <Icon name={icon} className="mb-3 h-5 w-5 opacity-80" />
      <div className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-[13px] font-medium opacity-80">{label}</div>
    </Link>
  );
}

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

  const reports = open.filter((w) => w.reported && w.status === "OPEN");
  const rest = open.filter((w) => !reports.includes(w));
  const overdue = rest.filter((w) => w.dueDate && w.dueDate < today);
  const dueToday = rest.filter((w) => w.dueDate && w.dueDate >= today && w.dueDate < tomorrow);
  const thisWeek = rest.filter((w) => w.dueDate && w.dueDate >= tomorrow && w.dueDate < weekEnd);
  const noDate = rest.filter((w) => !w.dueDate);
  const later = rest.length - overdue.length - dueToday.length - thisWeek.length - noDate.length;

  const lowStock = canEdit(user)
    ? await db.$queryRaw<{ id: string; name: string; inStock: number; minimum: number }[]>`
        SELECT id, name, "inStock", minimum FROM "Part" WHERE "inStock" < minimum ORDER BY name`
    : [];

  const group = (title: string, rows: typeof open) =>
    rows.length > 0 && (
      <Section title={`${title} · ${rows.length}`}>
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
        eyebrow={now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={`${greeting(now)}, ${user.name.split(" ")[0]}`}
        action={canEdit(user) && (
          <Link href="/work-orders/new" className={`${btn} md:hidden`} aria-label="New work order">
            <Icon name="plus" className="h-5 w-5" />
          </Link>
        )}
      />
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="New reports" value={reports.length} icon="bell" href="#reports" tone="border-amber-200 bg-amber-50 text-amber-900" />
        <Stat label="Overdue" value={overdue.length} icon="alert" href="#overdue" tone="border-red-200 bg-red-50 text-red-800" />
        <Stat label="Due today" value={dueToday.length} icon="clock" href="#today" tone="border-brand-200 bg-brand-50 text-brand-900" />
        <Stat label="This week" value={thisWeek.length} icon="today" href="#week" tone="border-sky-200 bg-sky-50 text-sky-900" />
      </div>
      {open.length === 0 && <Empty>Nothing open{user.role === "TECHNICIAN" ? " assigned to you" : ""}. Enjoy the quiet.</Empty>}
      <div id="reports">{group("New problem reports", reports)}</div>
      <div id="overdue">{group("Overdue", overdue)}</div>
      <div id="today">{group("Due today", dueToday)}</div>
      <div id="week">{group("Due this week", thisWeek)}</div>
      {group("No due date", noDate)}
      {later > 0 && (
        <p className="mb-8 px-1 text-sm text-slate-500">
          {later} more due later. <Link href="/work-orders" className="font-medium text-brand-700">See all work orders →</Link>
        </p>
      )}
      {lowStock.length > 0 && (
        <Section title="Low on stock" action={<Link href="/parts" className="text-sm font-medium text-brand-700">Parts →</Link>}>
          <List>
            {lowStock.map((p) => (
              <Link key={p.id} href={`/parts/${p.id}`} className="flex items-center justify-between px-4 py-3.5 transition hover:bg-slate-50">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-red-700 tabular-nums">{p.inStock} left · min {p.minimum}</span>
              </Link>
            ))}
          </List>
        </Section>
      )}
    </>
  );
}
