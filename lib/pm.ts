import type { PrismaClient } from "@prisma/client";
import { addInterval, isReadyToCreate } from "./recurrence";

// Creates the work order for each schedule whose next due date is within its lead time,
// then moves the schedule on. If the scheduler was off for several periods, only the
// most recent period gets a work order; older missed periods are skipped, not stacked up.
export async function generateDueWorkOrders(db: PrismaClient, now = new Date()) {
  const schedules = await db.pmSchedule.findMany({
    where: { active: true },
    include: { checklist: { include: { items: { orderBy: { position: "asc" } } } } },
  });
  const created: number[] = [];
  for (const s of schedules) {
    if (!isReadyToCreate(s.nextDue, s.leadDays, now)) continue;
    let due = s.nextDue;
    let next = addInterval(due, s.every, s.unit);
    while (isReadyToCreate(next, s.leadDays, now)) {
      due = next;
      next = addInterval(due, s.every, s.unit);
    }
    const wo = await db.$transaction(async (tx) => {
      const order = await tx.workOrder.create({
        data: {
          title: s.title,
          description: s.description,
          type: "PREVENTIVE",
          priority: s.priority,
          categories: s.categories,
          dueDate: due,
          assetId: s.assetId,
          locationId: s.locationId,
          vendorId: s.vendorId,
          scheduleId: s.id,
          checklistId: s.checklistId,
          assignees: s.assigneeId ? { create: { userId: s.assigneeId } } : undefined,
          answers: s.checklist
            ? { create: s.checklist.items.map((i) => ({ label: i.label, kind: i.kind, position: i.position })) }
            : undefined,
        },
      });
      await tx.pmSchedule.update({ where: { id: s.id }, data: { nextDue: next } });
      return order;
    });
    created.push(wo.number);
  }
  return created;
}
