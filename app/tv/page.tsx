import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Priority } from "@prisma/client";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { pickForHour } from "@/lib/art";
import { upcomingEvents, type CalEvent } from "@/lib/calendar";
import { tvKeyOk } from "@/lib/tv";
import { AutoRefresh, Clock } from "./auto-refresh";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Maintenance board", robots: { index: false } };

const DAY = 86_400_000;
// Work order due dates are calendar days stored at noon UTC; calendar events are real times in the server's zone.
const woDay = (d: Date) => d.toISOString().slice(0, 10);
const localDay = (d: Date) => d.toLocaleDateString("en-CA");
const dayLabel = (key: string, todayKey: string) => {
  const d = new Date(`${key}T12:00:00Z`);
  const diff = Math.round((d.getTime() - new Date(`${todayKey}T12:00:00Z`).getTime()) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
};
const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} days ago`;
};
const rank: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, NONE: 3 };

function groupBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>();
  for (const r of rows) m.set(key(r), [...(m.get(key(r)) ?? []), r]);
  return [...m.entries()];
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-h-0 flex-col rounded-[1vw] bg-slate-900 p-[1.2vw] ${className}`}>
      <h2 className="mb-[0.8vw] text-[1.1vw] font-semibold tracking-wider text-slate-400 uppercase">{title}</h2>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[1vw] p-[1vw] ${value ? tone : "bg-slate-900 text-slate-500"}`}>
      <div className="text-[3.6vw] leading-none font-bold tabular-nums">{value}</div>
      <div className="mt-[0.4vw] text-[1.1vw] font-medium">{label}</div>
    </div>
  );
}

const Quiet = ({ children }: { children: React.ReactNode }) => <p className="text-[1.2vw] text-slate-500">{children}</p>;

export default async function TvPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  if (!tvKeyOk((await searchParams).key) && !(await currentUser())) redirect("/login");

  const now = new Date();
  const todayKey = localDay(now);
  const today = new Date(`${todayKey}T00:00:00Z`);
  const weekEnd = new Date(today.getTime() + 7 * DAY);
  const [open, schedules, lowStock, doneThisWeek, cal, art] = await Promise.all([
    db.workOrder.findMany({
      where: { status: { not: "DONE" } },
      include: { location: { include: { parent: true } }, asset: true, assignees: { include: { user: true } } },
    }),
    db.pmSchedule.findMany({
      where: { active: true, nextDue: { lt: new Date(today.getTime() + 60 * DAY) } },
      include: { asset: true, location: true },
      orderBy: { nextDue: "asc" },
      take: 8,
    }),
    db.$queryRaw<{ name: string; inStock: number; minimum: number }[]>`SELECT name, "inStock", minimum FROM "Part" WHERE "inStock" < minimum ORDER BY name`,
    db.workOrder.count({ where: { status: "DONE", completedAt: { gte: new Date(today.getTime() - 7 * DAY) } } }),
    upcomingEvents(7),
    db.artwork.findMany({ where: { active: true }, select: { id: true, title: true, artist: true, credit: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const painting = pickForHour(art, now);

  const overdue = open.filter((w) => w.dueDate && woDay(w.dueDate) < todayKey);
  const reports = open.filter((w) => w.reported && w.status === "OPEN");
  const attention = [...new Set([...reports, ...overdue, ...open.filter((w) => w.priority === "HIGH")])].sort(
    (a, b) => rank[a.priority] - rank[b.priority] || a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const coming = open
    .filter((w) => w.dueDate && woDay(w.dueDate) >= todayKey && w.dueDate < weekEnd)
    .sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime());
  const where = (w: (typeof open)[number]) =>
    [w.asset?.name, w.location && (w.location.parent ? `${w.location.parent.name} › ${w.location.name}` : w.location.name)].filter(Boolean).join(" · ");

  return (
    <main data-fixed-theme className="flex h-dvh flex-col gap-[1vw] overflow-hidden bg-slate-950 p-[1.5vw] text-slate-100">
      <AutoRefresh />
      <div className="relative -mx-[1.5vw] -mt-[1.5vw] flex flex-col gap-[1vw] overflow-hidden px-[1.5vw] pt-[1.5vw] pb-[1vw]">
        {painting && (
          <>
            <img src={`/tv/art/${painting.id}`} alt="" className="absolute inset-0 -z-0 h-full w-full object-cover object-[center_45%]" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-transparent to-slate-950" />
            <div className="absolute right-[1.5vw] bottom-[0.3vw] text-[0.85vw] text-slate-300/80 italic">
              {painting.title}{painting.artist && ` · ${painting.artist}`}{painting.credit && ` · ${painting.credit}`}
            </div>
          </>
        )}
      <header className="relative flex items-center justify-between [text-shadow:0_2px_8px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-[1vw]">
          <img src="/icon.svg" alt="" className="h-[3.5vw] w-[3.5vw]" />
          <div>
            <h1 className="text-[2.2vw] leading-tight font-semibold">Building Maintenance</h1>
            <p className="text-[1.1vw] text-slate-400">The Springs Church</p>
          </div>
        </div>
        <Clock />
      </header>

      <div className={`relative grid grid-cols-5 gap-[1vw] ${painting ? "mt-[4.5vw] mb-[1.2vw]" : ""}`}>
        <Tile label="New problem reports" value={reports.length} tone="bg-amber-500 text-amber-950" />
        <Tile label="Overdue" value={overdue.length} tone="bg-red-600 text-white" />
        <Tile label="Due in the next 7 days" value={coming.length} tone="bg-sky-700 text-white" />
        <Tile label="Parts low on stock" value={lowStock.length} tone="bg-violet-700 text-white" />
        <Tile label="Finished this week" value={doneThisWeek} tone="bg-emerald-700 text-white" />
      </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-[1vw]">
        <Panel title="Needs attention">
          {attention.length === 0 ? <Quiet>Nothing urgent. 👍</Quiet> : (
            <ul className="space-y-[0.7vw]">
              {attention.slice(0, attention.length > 5 ? 4 : 5).map((w) => {
                const late = w.dueDate && woDay(w.dueDate) < todayKey;
                return (
                  <li key={w.id} className={`rounded-[0.6vw] border-l-[0.4vw] bg-slate-800 px-[0.9vw] py-[0.6vw] ${w.priority === "HIGH" ? "border-red-500" : w.reported ? "border-amber-400" : "border-slate-500"}`}>
                    <div className="truncate text-[1.35vw] font-medium">{w.title}</div>
                    <div className="truncate text-[1vw] text-slate-400">
                      #{w.number}
                      {w.reported && w.status === "OPEN" && <span className="text-amber-300"> · reported {ago(w.createdAt)}</span>}
                      {late && <span className="text-red-400"> · overdue since {w.dueDate!.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>}
                      {where(w) && ` · ${where(w)}`}
                    </div>
                  </li>
                );
              })}
              {attention.length > 5 && <Quiet>+ {attention.length - 4} more</Quiet>}
            </ul>
          )}
        </Panel>

        <Panel title="Coming up">
          {coming.length === 0 ? <Quiet>No work due in the next week.</Quiet> : (
            <div className="space-y-[0.8vw]">
              {groupBy(coming.slice(0, 10), (w) => woDay(w.dueDate!)).map(([day, rows]) => (
                <div key={day}>
                  <div className={`text-[1.1vw] font-semibold ${day === todayKey ? "text-sky-300" : "text-slate-300"}`}>{dayLabel(day, todayKey)}</div>
                  {rows.map((w) => (
                    <div key={w.id} className="truncate text-[1.25vw]">
                      {w.title}
                      {w.assignees.length > 0 && <span className="text-slate-400"> · {w.assignees.map((a) => a.user.name.split(" ")[0]).join(", ")}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {schedules.length > 0 && (
            <div className="mt-[1.2vw] border-t border-slate-700 pt-[0.8vw]">
              <div className="mb-[0.4vw] text-[1vw] font-semibold tracking-wider text-slate-400 uppercase">Inspections &amp; servicing, next 60 days</div>
              {schedules.map((s) => (
                <div key={s.id} className="flex justify-between gap-[1vw] text-[1.15vw]">
                  <span className="truncate">{s.title}</span>
                  <span className="shrink-0 text-slate-400">{s.nextDue.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Calendar">
          {!cal.configured ? <Quiet>Calendar not connected yet. Add Vlad&apos;s private calendar link as CALENDAR_ICS_URL.</Quiet>
            : cal.events.length === 0 ? <Quiet>Nothing on the calendar this week.</Quiet> : (
              <div className="space-y-[0.8vw]">
                {groupBy(cal.events.slice(0, 10), (e: CalEvent) => (e.allDay ? woDay(e.start) : localDay(e.start))).map(([day, rows]) => (
                  <div key={day}>
                    <div className={`text-[1.1vw] font-semibold ${day === todayKey ? "text-sky-300" : "text-slate-300"}`}>{dayLabel(day, todayKey)}</div>
                    {rows.map((e, i) => (
                      <div key={i} className="flex gap-[0.8vw] text-[1.25vw]">
                        <span className="w-[6vw] shrink-0 text-slate-400 tabular-nums">{e.allDay ? "All day" : time(e.start)}</span>
                        <span className="truncate">{e.title}{e.location && <span className="text-slate-400"> · {e.location}</span>}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          {cal.error && <p className="mt-[0.6vw] text-[0.9vw] text-amber-300">{cal.error}</p>}
          {lowStock.length > 0 && (
            <div className="mt-[1.2vw] border-t border-slate-700 pt-[0.8vw]">
              <div className="mb-[0.4vw] text-[1vw] font-semibold tracking-wider text-slate-400 uppercase">Low on stock</div>
              {lowStock.slice(0, 3).map((p) => (
                <div key={p.name} className="flex justify-between text-[1.15vw]">
                  <span className="truncate">{p.name}</span>
                  <span className="shrink-0 text-violet-300">{p.inStock} left (min {p.minimum})</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </main>
  );
}
