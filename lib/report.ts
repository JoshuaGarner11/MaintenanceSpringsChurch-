import type { Priority } from "@prisma/client";
import type { IconName } from "@/components/icon";

// What people can pick on the public "Report a problem" page.
export const ISSUES: { id: string; label: string; priority: Priority; icon: IconName }[] = [
  { id: "supplies", icon: "supplies", label: "Out of soap, paper or supplies", priority: "MEDIUM" },
  { id: "cleaning", icon: "sparkle", label: "Needs cleaning", priority: "MEDIUM" },
  { id: "clog", icon: "clog", label: "Toilet or sink clogged", priority: "HIGH" },
  { id: "leak", icon: "drop", label: "Water leak or flooding", priority: "HIGH" },
  { id: "broken", icon: "wrench", label: "Something broken or damaged", priority: "MEDIUM" },
  { id: "lights", icon: "bulb", label: "Lights or power out", priority: "MEDIUM" },
  { id: "temp", icon: "thermo", label: "Too hot or too cold", priority: "LOW" },
  { id: "other", icon: "dots", label: "Something else", priority: "MEDIUM" },
];

export const PER_IP_LIMIT = 5; // reports per device...
export const PER_IP_MINUTES = 15; // ...in this many minutes
export const GLOBAL_HOURLY_LIMIT = 60;
