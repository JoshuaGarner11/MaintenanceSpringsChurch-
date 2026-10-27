import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { formOptions } from "@/lib/options";
import { describeRepeat } from "@/lib/recurrence";
import { ConfirmButton } from "@/components/confirm-button";
import { ScheduleForm } from "@/components/schedule-form";
import { btnDanger, Card, Empty, List, PageHeader, Section } from "@/components/ui";
import { WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";
import { deleteSchedule, updateSchedule } from "../actions";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const s = await db.pmSchedule.findUnique({
    where: { id: (await params).id },
    include: { workOrders: { include: workOrderRowInclude, orderBy: { dueDate: "desc" } }, checklist: true },
  });
  if (!s) notFound();
  return (
    <>
      <PageHeader title={s.title} back="/schedules" />
      <Card className="mb-6">
        <p className="text-sm text-slate-600">
          {describeRepeat(s.every, s.unit)}. Next due {fmtDate(s.nextDue)}; its work order is created {s.leadDays} days before.
          {s.checklist && ` Uses the "${s.checklist.name}" checklist.`}
          {!s.active && " Paused."}
        </p>
      </Card>
      <Section title="Work orders from this schedule">
        {s.workOrders.length === 0 ? <Empty>None yet.</Empty> : <List>{s.workOrders.map((w) => <WorkOrderRow key={w.id} wo={w} />)}</List>}
      </Section>
      {user.role === "ADMIN" && (
        <Section title="Edit schedule">
          <Card><ScheduleForm action={updateSchedule.bind(null, s.id)} options={await formOptions()} s={s} submitLabel="Save" /></Card>
          <form action={deleteSchedule.bind(null, s.id)} className="mt-4 text-right">
            <ConfirmButton className={btnDanger} message="Delete this schedule? Past work orders are kept.">Delete schedule</ConfirmButton>
          </form>
        </Section>
      )}
    </>
  );
}
