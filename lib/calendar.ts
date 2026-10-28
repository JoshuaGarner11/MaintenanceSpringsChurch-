import ical, { type CalendarResponse, type ParameterValue, type VEvent } from "node-ical";

export type CalEvent = { title: string; start: Date; end: Date; allDay: boolean; location?: string };

const text = (v: ParameterValue | undefined) => (v == null ? "" : typeof v === "string" ? v : v.val);

// Turns a parsed calendar into the events (including repeats) that overlap [from, to).
export function eventsBetween(cal: CalendarResponse, from: Date, to: Date): CalEvent[] {
  const out: CalEvent[] = [];
  for (const c of Object.values(cal)) {
    if (!c || c.type !== "VEVENT" || (c as VEvent).status === "CANCELLED") continue;
    const ev = c as VEvent;
    for (const i of ical.expandRecurringEvent(ev, { from, to, expandOngoing: true })) {
      const start = new Date(i.start);
      const end = new Date(i.end ?? i.start);
      if (end <= from || start >= to) continue;
      if (i.event.status === "CANCELLED") continue;
      out.push({ title: text(i.summary) || "(busy)", start, end, allDay: i.isFullDay, location: text(i.event.location) || undefined });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || Number(b.allDay) - Number(a.allDay));
}

let cache: { at: number; events: CalEvent[]; error?: string } | null = null;
const CACHE_MS = 10 * 60_000;

// Reads the private calendar link(s) in CALENDAR_ICS_URL (comma-separated) for the next `days` days.
// Cached for ten minutes so the TV refreshing every minute doesn't hammer Google/Outlook.
export async function upcomingEvents(days = 7): Promise<{ events: CalEvent[]; error?: string; configured: boolean }> {
  const urls = (process.env.CALENDAR_ICS_URL ?? "").split(",").map((u) => u.trim().replace(/^webcal:/, "https:")).filter(Boolean);
  if (urls.length === 0) return { events: [], configured: false };
  if (cache && Date.now() - cache.at < CACHE_MS) return { ...cache, configured: true };
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + days * 86_400_000);
  const events: CalEvent[] = [];
  let error: string | undefined;
  for (const url of urls) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      events.push(...eventsBetween(ical.sync.parseICS(await res.text()), from, to));
    } catch (e) {
      console.error("[calendar]", e);
      error = "Couldn't reach the calendar. Showing the last good copy if there is one.";
    }
  }
  if (error && cache) return { events: cache.events, error, configured: true };
  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  cache = { at: Date.now(), events, error };
  return { events, error, configured: true };
}
