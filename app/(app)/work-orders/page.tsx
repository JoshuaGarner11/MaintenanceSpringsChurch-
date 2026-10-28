import Link from "next/link";
import type { Prisma, WorkStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { Icon } from "@/components/icon";
import { btn, Empty, input, List, PageHeader } from "@/components/ui";
import { WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";

export const dynamic = "force-dynamic";

const filters: { key: string; label: string; where: Prisma.WorkOrderWhereInput }[] = [
  { key: "open", label: "Open", where: { status: { not: "DONE" as WorkStatus } } },
  { key: "done", label: "Done", where: { status: "DONE" } },
  { key: "all", label: "All", where: {} },
];

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<{ f?: string; q?: string; mine?: string }> }) {
  const user = await requireUser();
  const { f = "open", q = "", mine } = await searchParams;
  const filter = filters.find((x) => x.key === f) ?? filters[0];
  const where: Prisma.WorkOrderWhereInput = {
    ...filter.where,
    ...(mine ? { assignees: { some: { userId: user.id } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { asset: { name: { contains: q, mode: "insensitive" } } },
            { location: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const rows = await db.workOrder.findMany({
    where,
    include: workOrderRowInclude,
    orderBy: filter.key === "done" ? { completedAt: "desc" } : [{ dueDate: { sort: "asc", nulls: "last" } }, { number: "desc" }],
    take: 200,
  });
  const link = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams({ f, ...(q ? { q } : {}), ...(mine ? { mine } : {}) });
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k);
    return `/work-orders?${p}`;
  };
  return (
    <>
      <PageHeader title="Work orders" action={canEdit(user) && <Link href="/work-orders/new" className={btn}><Icon name="plus" className="h-4 w-4" />New</Link>} />
      <div className="mb-3 flex items-center gap-2">
        <div className="inline-flex rounded-xl bg-slate-200/60 p-1">
          {filters.map((x) => (
            <Link
              key={x.key}
              href={link({ f: x.key })}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${x.key === filter.key ? "bg-surface text-slate-950 shadow-soft" : "text-slate-600 hover:text-slate-900"}`}
            >
              {x.label}
            </Link>
          ))}
        </div>
        <Link
          href={link({ mine: mine ? undefined : "1" })}
          className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${mine ? "bg-brand-600 text-white shadow-soft" : "text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50"}`}
        >
          Mine
        </Link>
      </div>
      <form className="relative mb-5">
        <input type="hidden" name="f" value={f} />
        {mine && <input type="hidden" name="mine" value={mine} />}
        <Icon name="search" className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
        <input name="q" type="search" defaultValue={q} placeholder="Search title, asset or room" className={`${input} pl-10`} />
      </form>
      {rows.length === 0 ? (
        <Empty>No work orders match.</Empty>
      ) : (
        <List>
          {rows.map((w) => (
            <WorkOrderRow key={w.id} wo={w} />
          ))}
        </List>
      )}
    </>
  );
}
