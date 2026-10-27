import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { WorkOrderForm } from "@/components/work-order-form";
import { updateWorkOrder } from "../../actions";

export default async function EditWorkOrderPage({ params }: { params: Promise<{ number: string }> }) {
  await requireUser("ADMIN", "TECHNICIAN");
  const number = Number((await params).number);
  const wo = Number.isInteger(number) ? await db.workOrder.findUnique({ where: { number }, include: { assignees: true } }) : null;
  if (!wo) notFound();
  return (
    <>
      <PageHeader title={`Edit #${wo.number}`} back={`/work-orders/${wo.number}`} />
      <Card>
        <WorkOrderForm
          action={updateWorkOrder.bind(null, wo.id)}
          options={await formOptions()}
          wo={wo}
          assigneeIds={wo.assignees.map((a) => a.userId)}
          submitLabel="Save changes"
        />
      </Card>
    </>
  );
}
