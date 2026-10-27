import Link from "next/link";
import type { Priority, WorkStatus } from "@prisma/client";

export function PageHeader({ title, action, back }: { title: string; action?: React.ReactNode; back?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {back && (
        <Link href={back} className="-ml-1 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-200" aria-label="Back">
          ←
        </Link>
      )}
      <h1 className="flex-1 truncate text-xl font-semibold">{title}</h1>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">{children}</p>;
}

export const btn =
  "inline-flex items-center justify-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50";
export const inputBase =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-brand-600 focus:ring-2 focus:ring-brand-100 focus:outline-none";
export const input = `w-full ${inputBase}`;

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const statusStyle: Record<WorkStatus, string> = {
  OPEN: "bg-sky-100 text-sky-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  ON_HOLD: "bg-slate-200 text-slate-700",
  DONE: "bg-emerald-100 text-emerald-800",
};
const statusText: Record<WorkStatus, string> = { OPEN: "Open", IN_PROGRESS: "In progress", ON_HOLD: "On hold", DONE: "Done" };

export function StatusBadge({ status }: { status: WorkStatus }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[status]}`}>{statusText[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "NONE") return null;
  const style = { HIGH: "text-red-700 bg-red-50", MEDIUM: "text-amber-700 bg-amber-50", LOW: "text-slate-600 bg-slate-100" }[priority];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{priority[0] + priority.slice(1).toLowerCase()}</span>;
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "red" | "amber" | "green" }) {
  const style = {
    slate: "bg-slate-100 text-slate-700",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-emerald-100 text-emerald-800",
  }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>{children}</span>;
}

export function ListLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50">
      {children}
    </Link>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{children}</div>;
}
