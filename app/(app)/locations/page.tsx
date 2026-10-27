import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btnSecondary, Card, input, PageHeader } from "@/components/ui";
import { Select } from "@/components/select";
import { createLocation } from "./actions";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const user = await requireUser();
  const all = await db.location.findMany({
    include: { _count: { select: { workOrders: { where: { status: { not: "DONE" } } }, assets: true } } },
    orderBy: { name: "asc" },
  });
  const top = all.filter((l) => !l.parentId);
  const childrenOf = (id: string) => all.filter((l) => l.parentId === id);
  const counts = (l: (typeof all)[number]) =>
    [l._count.assets && `${l._count.assets} assets`, l._count.workOrders && `${l._count.workOrders} open`].filter(Boolean).join(" · ");
  return (
    <>
      <PageHeader title="Locations" />
      <div className="space-y-3">
        {top.map((area) => {
          const rooms = childrenOf(area.id);
          return (
            <details key={area.id} className="group rounded-xl border border-slate-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3">
                <span className="text-slate-400 transition group-open:rotate-90">›</span>
                <Link href={`/locations/${area.id}`} className="flex-1 font-medium">{area.name}</Link>
                <span className="text-sm text-slate-500">{rooms.length > 0 ? `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}` : counts(area)}</span>
              </summary>
              {rooms.length > 0 && (
                <div className="border-t border-slate-100">
                  {rooms.map((r) => (
                    <Link key={r.id} href={`/locations/${r.id}`} className="flex justify-between border-b border-slate-100 py-2 pr-4 pl-10 text-sm last:border-0 hover:bg-slate-50">
                      <span>{r.name}</span>
                      <span className="text-slate-500">{counts(r)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </details>
          );
        })}
      </div>
      {user.role === "ADMIN" && (
        <Card className="mt-6">
          <form action={createLocation} className="space-y-2">
            <div className="text-sm font-medium">Add a location</div>
            <input name="name" placeholder="Name, e.g. 165 - Storage" required className={input} />
            <Select name="parentId" options={top.map((t) => ({ id: t.id, name: t.name }))} empty="Top-level area" />
            <button className={btnSecondary}>Add</button>
          </form>
        </Card>
      )}
    </>
  );
}
