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
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{wo.title}</div>
          <div className="truncate text-sm text-slate-500">
            #{wo.number}
            {where && ` · ${where}`}
            {wo.assignees.length > 0 && ` · ${wo.assignees.map((a) => a.user.name.split(" ")[0]).join(", ")}`}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge status={wo.status} />
          {wo.dueDate && wo.status !== "DONE" && (
            <span className={`text-xs ${overdue ? "font-semibold text-red-700" : "text-slate-500"}`}>
              {overdue ? "Overdue · " : "Due "}
              {fmtDate(wo.dueDate)}
            </span>
          )}
          {wo.status === "DONE" && wo.completedAt && <span className="text-xs text-slate-500">Done {fmtDate(wo.completedAt)}</span>}
          <PriorityBadge priority={wo.priority} />
        </div>
      </div>
    </ListLink>
  );
}

export function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
