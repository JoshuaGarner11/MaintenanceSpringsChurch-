import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btn } from "@/components/ui";
import { PrintButton } from "@/components/print-button";

export default async function AssetLabelPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const asset = await db.asset.findUnique({ where: { id: (await params).id }, include: { location: true } });
  if (!asset) notFound();
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-64 rounded-xl border-2 border-slate-800 bg-white p-4 text-center">
        <img src={`/qr?path=/assets/${asset.id}`} alt="QR code" className="mx-auto h-48 w-48" />
        <div className="mt-2 font-semibold">{asset.name}</div>
        {asset.location && <div className="text-sm text-slate-600">{asset.location.name}</div>}
        <div className="mt-1 text-xs text-slate-500">Scan for history · Springs Maintenance</div>
      </div>
      <PrintButton className={`${btn} print:hidden`} />
    </div>
  );
}
