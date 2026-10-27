export type RepeatUnit = "DAY" | "WEEK" | "MONTH" | "YEAR";

// Adds `every` units to a date. Month and year steps keep the day of month,
// clamping to the last day when the target month is shorter (Jan 31 -> Feb 28).
export function addInterval(date: Date, every: number, unit: RepeatUnit): Date {
  const d = new Date(date.getTime());
  if (unit === "DAY") {
    d.setUTCDate(d.getUTCDate() + every);
    return d;
  }
  if (unit === "WEEK") {
    d.setUTCDate(d.getUTCDate() + 7 * every);
    return d;
  }
  const months = unit === "MONTH" ? every : every * 12;
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

// The work order for a schedule is created `leadDays` before it is due.
export function isReadyToCreate(nextDue: Date, leadDays: number, now: Date): boolean {
  const createFrom = new Date(nextDue.getTime() - leadDays * 86_400_000);
  return createFrom.getTime() <= now.getTime();
}

export function describeRepeat(every: number, unit: RepeatUnit): string {
  const word = { DAY: "day", WEEK: "week", MONTH: "month", YEAR: "year" }[unit];
  if (every === 1) return unit === "DAY" ? "Daily" : `${word[0].toUpperCase()}${word.slice(1)}ly`;
  return `Every ${every} ${word}s`;
}
