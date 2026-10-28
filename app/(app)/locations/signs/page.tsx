import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btn, btnSecondary, PageHeader } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { ReportSign } from "@/components/report-sign";

export const dynamic = "force-dynamic";

// Every room's "Report a problem" sign on one page, ready to print. ?in=<area id> narrows it to one area.
export default async function SignsPage({ searchParams }: { searchParams: Promise<{ in?: string }> }) {
  await requireUser();
  const areaId = (await searchParams).in;
  const [areas, rooms] = await Promise.all([
    db.location.findMany({ where: { parentId: null }, orderBy: { name: "asc" } }),
    db.location.findMany({
      where: areaId ? { OR: [{ id: areaId }, { parentId: areaId }] } : {},
      include: { parent: true },
      orderBy: [{ parent: { name: "asc" } }, { name: "asc" }],
    }),
  ]);
  return (
    <>
      <div className="print:hidden">
        <PageHeader title="Report signs" back="/locations" action={<PrintButton className={btn} />} />
        <p className="mb-3 text-sm text-slate-600">Print these and post one in each room. Anyone can scan to report a problem, no sign-in needed.</p>
        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/locations/signs" className={`${btnSecondary} ${areaId ? "" : "border-brand-600 text-brand-700"}`}>All rooms</Link>
          {areas.map((a) => (
            <Link key={a.id} href={`/locations/signs?in=${a.id}`} className={`${btnSecondary} ${a.id === areaId ? "border-brand-600 text-brand-700" : ""}`}>{a.name}</Link>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center gap-6 print:block">
        {rooms.map((r) => <ReportSign key={r.id} id={r.id} name={r.name} area={r.parent?.name} />)}
      </div>
    </>
  );
}
