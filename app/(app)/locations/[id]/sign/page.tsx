import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btn } from "@/components/ui";
import { PrintButton } from "@/components/print-button";
import { ReportSign } from "@/components/report-sign";

export default async function LocationSignPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const loc = await db.location.findUnique({ where: { id: (await params).id }, include: { parent: true } });
  if (!loc) notFound();
  return (
    <div className="flex flex-col items-center gap-4">
      <ReportSign id={loc.id} name={loc.name} area={loc.parent?.name} />
      <PrintButton className={`${btn} print:hidden`} />
    </div>
  );
}
