import { requireUser } from "@/lib/auth";
import { formOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { WorkOrderForm } from "@/components/work-order-form";
import { createWorkOrder } from "../actions";

export default async function NewWorkOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ assetId?: string; locationId?: string }>;
}) {
  await requireUser("ADMIN", "TECHNICIAN");
  const defaults = await searchParams;
  return (
    <>
      <PageHeader title="New work order" back="/work-orders" />
      <Card>
        <WorkOrderForm action={createWorkOrder} options={await formOptions()} defaults={defaults} submitLabel="Create work order" />
      </Card>
    </>
  );
}
