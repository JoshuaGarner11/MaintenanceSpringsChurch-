import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReportForm } from "./report-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report a problem · The Springs Church", robots: { index: false } };

// Public page behind the QR sign in each room. No sign-in.
export default async function ReportPage({ params }: { params: Promise<{ locationId: string }> }) {
  const location = await db.location.findUnique({ where: { id: (await params).locationId }, include: { parent: true } });
  if (!location) notFound();
  return (
    <main className="relative mx-auto max-w-md overflow-x-clip px-4 pt-8 pb-12">
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-80 w-[560px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="mb-7 text-center">
        <img src="/icon.svg" alt="" className="mx-auto mb-4 h-12 w-12 rounded-2xl shadow-float" />
        <h1 className="text-[28px] font-semibold tracking-tight">Report a problem</h1>
        <p className="mt-1 text-slate-600">
          {location.parent && <>{location.parent.name} › </>}
          <span className="font-medium text-slate-800">{location.name}</span>
        </p>
      </div>
      <ReportForm locationId={location.id} />
    </main>
  );
}
