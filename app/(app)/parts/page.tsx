import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Badge, btn, btnSecondary, Empty, List, ListLink, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PartsPage() {
  const user = await requireUser();
  const parts = await db.part.findMany({ include: { location: true }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader
        title="Parts"
        action={
          <div className="flex gap-2">
            <Link href="/vendors" className={btnSecondary}>Vendors</Link>
            {user.role === "ADMIN" && <Link href="/parts/new" className={btn}>+ New</Link>}
          </div>
        }
      />
      {parts.length === 0 ? (
        <Empty>No parts yet.</Empty>
      ) : (
        <List>
          {parts.map((p) => {
            const low = p.inStock < p.minimum;
            return (
              <ListLink key={p.id} href={`/parts/${p.id}`}>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-sm text-slate-500">{[p.location?.name, p.area].filter(Boolean).join(" · ")}</div>
                  </div>
                  {p.critical && <Badge tone="amber">Critical</Badge>}
                  <span className={`text-sm ${low ? "font-semibold text-red-700" : "text-slate-600"}`}>
                    {p.inStock} <span className="font-normal text-slate-400">/ min {p.minimum}</span>
                  </span>
                </div>
              </ListLink>
            );
          })}
        </List>
      )}
    </>
  );
}
