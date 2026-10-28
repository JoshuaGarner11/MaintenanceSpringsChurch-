import type { Priority } from "@prisma/client";

// What people can pick on the public "Report a problem" page.
export const ISSUES: { id: string; label: string; priority: Priority }[] = [
  { id: "supplies", label: "Out of soap, paper or supplies", priority: "MEDIUM" },
  { id: "cleaning", label: "Needs cleaning", priority: "MEDIUM" },
  { id: "clog", label: "Toilet or sink clogged", priority: "HIGH" },
  { id: "leak", label: "Water leak or flooding", priority: "HIGH" },
  { id: "broken", label: "Something broken or damaged", priority: "MEDIUM" },
  { id: "lights", label: "Lights or power out", priority: "MEDIUM" },
  { id: "temp", label: "Too hot or too cold", priority: "LOW" },
  { id: "other", label: "Something else", priority: "MEDIUM" },
];

export const PER_IP_LIMIT = 5; // reports per device...
export const PER_IP_MINUTES = 15; // ...in this many minutes
export const GLOBAL_HOURLY_LIMIT = 60;
