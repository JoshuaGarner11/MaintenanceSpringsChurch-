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
    <main className="mx-auto max-w-md px-4 py-6">
      <div className="mb-5 text-center">
        <img src="/icon.svg" alt="" className="mx-auto mb-2 h-10 w-10" />
        <h1 className="text-2xl font-semibold">Report a problem</h1>
        <p className="text-slate-600">
          {location.parent && <>{location.parent.name} › </>}
          <span className="font-medium text-slate-800">{location.name}</span>
        </p>
      </div>
      <ReportForm locationId={location.id} />
    </main>
  );
}
