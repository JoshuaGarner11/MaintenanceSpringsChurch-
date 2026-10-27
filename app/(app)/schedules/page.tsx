import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { addInterval, describeRepeat } from "@/lib/recurrence";
import { Badge, btn, Empty, List, ListLink, PageHeader, Section } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SchedulesPage() {
  const user = await requireUser();
  const schedules = await db.pmSchedule.findMany({ include: { asset: true, location: true }, orderBy: { nextDue: "asc" } });
  const horizon = new Date(Date.now() + 90 * 86_400_000);
  const upcoming = schedules
    .filter((s) => s.active)
    .flatMap((s) => {
      const out: { s: typeof s; due: Date }[] = [];
      for (let due = s.nextDue; due <= horizon && out.length < 13; due = addInterval(due, s.every, s.unit)) out.push({ s, due });
      return out;
    })
    .sort((a, b) => a.due.getTime() - b.due.getTime());
  return (
    <>
      <PageHeader title="Schedules" action={user.role === "ADMIN" && <Link href="/schedules/new" className={btn}>+ New</Link>} />
      <Section title="Next 90 days">
        {upcoming.length === 0 ? (
          <Empty>Nothing scheduled in the next 90 days.</Empty>
        ) : (
          <List>
            {upcoming.map(({ s, due }) => (
              <ListLink key={`${s.id}-${due.toISOString()}`} href={`/schedules/${s.id}`}>
                <div className="flex justify-between gap-2">
                  <span className="truncate">{s.title}</span>
                  <span className="shrink-0 text-sm text-slate-500">{fmtDate(due)}</span>
                </div>
              </ListLink>
            ))}
          </List>
        )}
      </Section>
      <Section title={`All schedules (${schedules.length})`}>
        {schedules.length === 0 ? (
          <Empty>No repeating work set up yet.</Empty>
        ) : (
          <List>
            {schedules.map((s) => (
              <ListLink key={s.id} href={`/schedules/${s.id}`}>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{s.title}</div>
                    <div className="truncate text-sm text-slate-500">
                      {describeRepeat(s.every, s.unit)} · next {fmtDate(s.nextDue)}
                      {(s.asset || s.location) && ` · ${s.asset?.name ?? s.location?.name}`}
                    </div>
                  </div>
                  {!s.active && <Badge>Paused</Badge>}
                </div>
              </ListLink>
            ))}
          </List>
        )}
      </Section>
    </>
  );
}
