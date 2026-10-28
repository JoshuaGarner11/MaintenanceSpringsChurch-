import Link from "next/link";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { Badge, btn, Empty, input, List, ListLink, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const assets = await db.asset.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
            { serialNumber: { contains: q, mode: "insensitive" } },
            { location: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {},
    include: {
      location: { select: { name: true } },
      parent: { select: { name: true } },
      _count: { select: { workOrders: { where: { status: { not: "DONE" } } } } },
    },
    orderBy: { name: "asc" },
  });
  return (
    <>
      <PageHeader title="Assets" action={canEdit(user) && <Link href="/assets/new" className={btn}>+ New</Link>} />
      <form className="mb-4">
        <input name="q" defaultValue={q} placeholder="Search name, model, serial or room" className={input} />
      </form>
      {assets.length === 0 ? (
        <Empty>No assets{q ? " match" : " yet"}.</Empty>
      ) : (
        <List>
          {assets.map((a) => (
            <ListLink key={a.id} href={`/assets/${a.id}`}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{a.name}</div>
                  <div className="truncate text-sm text-slate-500">
                    {[a.parent && `Part of ${a.parent.name}`, a.location?.name, a.type].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {a.status === "DOWN" && <Badge tone="red">Down</Badge>}
                  {a.criticality === "CRITICAL" && <Badge tone="amber">Critical</Badge>}
                  {a.needsReview && <Badge>Needs review</Badge>}
                  {a._count.workOrders > 0 && <span className="text-xs text-slate-500">{a._count.workOrders} open</span>}
                </div>
              </div>
            </ListLink>
          ))}
        </List>
      )}
    </>
  );
}
