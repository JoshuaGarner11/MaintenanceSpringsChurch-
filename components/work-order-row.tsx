import type { Prisma } from "@prisma/client";
import { fmtDate } from "@/lib/format";
import { ListLink, PriorityBadge, StatusBadge } from "./ui";

export const workOrderRowInclude = {
  asset: { select: { name: true } },
  location: { select: { name: true } },
  assignees: { include: { user: { select: { name: true } } } },
} satisfies Prisma.WorkOrderInclude;

type Row = Prisma.WorkOrderGetPayload<{ include: typeof workOrderRowInclude }>;

export function WorkOrderRow({ wo, now = new Date() }: { wo: Row; now?: Date }) {
  const overdue = wo.status !== "DONE" && wo.dueDate && wo.dueDate < startOfDay(now);
  const where = [wo.asset?.name, wo.location?.name].filter(Boolean).join(" · ");
  return (
    <ListLink href={`/work-orders/${wo.number}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-slate-950">{wo.title}</div>
          <div className="mt-0.5 truncate text-[13px] text-slate-500">
            <span className="font-mono text-[12px] text-slate-400">#{wo.number}</span>
            {where && ` · ${where}`}
            {wo.assignees.length > 0 && ` · ${wo.assignees.map((a) => a.user.name.split(" ")[0]).join(", ")}`}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={wo.status} />
            <PriorityBadge priority={wo.priority} />
            {wo.reported && wo.status === "OPEN" && <span className="text-xs font-medium text-amber-700">Reported via QR</span>}
          </div>
        </div>
        <div className="shrink-0 pt-0.5 text-right text-xs tabular-nums">
          {wo.dueDate && wo.status !== "DONE" && (
            <span className={overdue ? "font-semibold text-red-700" : "text-slate-500"}>
              {overdue ? "Overdue" : "Due"}
              <br />
              {fmtDate(wo.dueDate)}
            </span>
          )}
          {wo.status === "DONE" && wo.completedAt && <span className="text-slate-500">Done<br />{fmtDate(wo.completedAt)}</span>}
        </div>
      </div>
    </ListLink>
  );
}

export function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
