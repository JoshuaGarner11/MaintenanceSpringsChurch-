import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney } from "@/lib/format";
import { formOptions } from "@/lib/options";
import { ConfirmButton } from "@/components/confirm-button";
import { PartForm } from "@/components/part-form";
import { btnDanger, btnSecondary, Card, Empty, input, inputBase, PageHeader, Section } from "@/components/ui";
import { adjustStock, deletePart, updatePart } from "../actions";

export const dynamic = "force-dynamic";

export default async function PartPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const part = await db.part.findUnique({
    where: { id: (await params).id },
    include: { location: true, vendor: true, usages: { include: { workOrder: true }, orderBy: { createdAt: "desc" }, take: 30 } },
  });
  if (!part) notFound();
  const low = part.inStock < part.minimum;
  return (
    <>
      <PageHeader title={part.name} back="/parts" />
      <Card className="mb-6">
        <div className={`text-3xl font-semibold ${low ? "text-red-700" : ""}`}>{part.inStock}</div>
        <div className="text-sm text-slate-500">
          in stock · minimum {part.minimum}
          {part.unitCostCents != null && ` · ${fmtMoney(part.unitCostCents)} each`}
          {part.vendor && ` · from ${part.vendor.name}`}
          {part.leadTimeDays != null && ` · ${part.leadTimeDays} days to arrive`}
        </div>
        {low && <p className="mt-2 text-sm font-medium text-red-700">Below minimum. Time to reorder.</p>}
        {canEdit(user) && (
          <form action={adjustStock.bind(null, part.id)} className="mt-4 flex flex-wrap gap-2">
            <input name="amount" type="number" defaultValue={1} className={`${inputBase} shrink-0 w-24`} />
            <button name="mode" value="add" className={btnSecondary}>Add to stock</button>
            <button name="mode" value="count" className={btnSecondary}>Set count</button>
          </form>
        )}
      </Card>
      <Section title="Used on">
        {part.usages.length === 0 ? (
          <Empty>Not used on any work order yet.</Empty>
        ) : (
          <Card>
            <ul className="space-y-1 text-sm">
              {part.usages.map((u) => (
                <li key={u.id}>
                  {u.quantity} on <Link className="text-brand-700" href={`/work-orders/${u.workOrder.number}`}>#{u.workOrder.number} {u.workOrder.title}</Link>{" "}
                  <span className="text-slate-500">{fmtDate(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Section>
      {user.role === "ADMIN" && (
        <Section title="Edit part">
          <Card><PartForm action={updatePart.bind(null, part.id)} options={await formOptions()} part={part} submitLabel="Save" /></Card>
          <form action={deletePart.bind(null, part.id)} className="mt-4 text-right">
            <ConfirmButton className={btnDanger} message={`Delete ${part.name}?`}>Delete part</ConfirmButton>
          </form>
        </Section>
      )}
    </>
  );
}
