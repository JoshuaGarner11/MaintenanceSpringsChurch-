import type { ChecklistItemKind } from "@prisma/client";

// MaintainX exports a checklist answer as text: "PASS,Notes: all good", "Fail", or free text.
export function parseAnswer(raw: string): { kind: ChecklistItemKind; value: string | null; note: string | null } {
  const m = /^(pass|fail|flag)\b[,\s]*(?:notes?:\s*)?(.*)$/is.exec(raw.trim());
  if (m) return { kind: "PASS_FAIL", value: m[1].toUpperCase(), note: m[2].trim() || null };
  const t = raw.trim();
  return { kind: "TEXT", value: t === "" ? null : t, note: null };
}
