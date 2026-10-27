export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function fmtMoney(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function toDateInput(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

// Form dates are calendar days; store them at noon UTC so no time zone shifts the day.
export function fromDateInput(s: FormDataEntryValue | null): Date | null {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T12:00:00Z`);
}

export function str(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function int(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number.parseInt(typeof v === "string" ? v : "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export function dollarsToCents(v: FormDataEntryValue | null): number | null {
  const t = str(v);
  if (t == null) return null;
  const n = Number(t.replace(/[$,]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
