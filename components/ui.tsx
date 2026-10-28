import Link from "next/link";
import type { Priority, WorkStatus } from "@prisma/client";
import { Icon } from "./icon";

export function PageHeader({ title, action, back, eyebrow }: { title: string; action?: React.ReactNode; back?: string; eyebrow?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      {back && (
        <Link
          href={back}
          aria-label="Back"
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-surface text-slate-600 shadow-soft transition hover:text-slate-900"
        >
          <Icon name="back" className="h-4 w-4" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="mb-1 text-[13px] font-medium text-slate-500">{eyebrow}</div>}
        <h1 className="line-clamp-2 text-[26px] text-balance leading-tight font-semibold tracking-tight text-slate-950">{title}</h1>
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-surface p-4 shadow-soft ${className}`}>{children}</div>;
}

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

const btnBase =
  "inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-medium transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const btn = `${btnBase} bg-brand-600 text-white shadow-soft hover:brightness-110`;
export const btnSecondary = `${btnBase} border border-slate-200 bg-surface text-slate-800 shadow-soft hover:bg-slate-50`;
export const btnDanger = `${btnBase} border border-red-200 bg-surface text-red-700 hover:bg-red-50`;
export const inputBase =
  "min-h-11 rounded-xl border border-slate-300/80 bg-surface px-3.5 py-2 text-slate-900 shadow-soft transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none";
export const input = `w-full ${inputBase}`;

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const statusStyle: Record<WorkStatus, string> = {
  OPEN: "bg-sky-50 text-sky-700 ring-sky-200 [--dot:var(--color-sky-500)]",
  IN_PROGRESS: "bg-amber-50 text-amber-800 ring-amber-200 [--dot:var(--color-amber-500)]",
  ON_HOLD: "bg-slate-100 text-slate-600 ring-slate-200 [--dot:var(--color-slate-400)]",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200 [--dot:var(--color-emerald-500)]",
};
const statusText: Record<WorkStatus, string> = { OPEN: "Open", IN_PROGRESS: "In progress", ON_HOLD: "On hold", DONE: "Done" };

const pill = "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset";

export function StatusBadge({ status }: { status: WorkStatus }) {
  return (
    <span className={`${pill} ${statusStyle[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--dot)]" />
      {statusText[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "NONE") return null;
  const style = { HIGH: "bg-red-50 text-red-700 ring-red-200", MEDIUM: "bg-amber-50 text-amber-800 ring-amber-200", LOW: "bg-slate-100 text-slate-600 ring-slate-200" }[priority];
  return <span className={`${pill} ${style}`}>{priority === "HIGH" ? "High" : priority === "MEDIUM" ? "Medium" : "Low"}</span>;
}

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "red" | "amber" | "green" }) {
  const style = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  }[tone];
  return <span className={`${pill} ${style}`}>{children}</span>;
}

export function ListLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 px-4 py-3.5 transition hover:bg-slate-50 active:bg-slate-100">
      <div className="min-w-0 flex-1">{children}</div>
      <Icon name="chevron" className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
    </Link>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200/80 bg-surface shadow-soft">{children}</div>;
}
