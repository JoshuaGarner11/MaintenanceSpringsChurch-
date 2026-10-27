import type { Part } from "@prisma/client";
import type { FormOptions } from "@/lib/options";
import { btn, Field, input } from "./ui";
import { Select } from "./select";

export function PartForm({ action, options, part, submitLabel }: { action: (f: FormData) => Promise<void>; options: FormOptions; part?: Part; submitLabel: string }) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Name"><input name="name" required defaultValue={part?.name} className={input} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        {!part && <Field label="In stock now"><input name="inStock" type="number" defaultValue={0} className={input} /></Field>}
        <Field label="Minimum to keep" hint="You'll be alerted below this"><input name="minimum" type="number" min={0} defaultValue={part?.minimum ?? 0} className={input} /></Field>
        <Field label="Stored at"><Select name="locationId" options={options.locations} value={part?.locationId} /></Field>
        <Field label="Shelf or area"><input name="area" defaultValue={part?.area ?? ""} className={input} /></Field>
        <Field label="Vendor"><Select name="vendorId" options={options.vendors} value={part?.vendorId} /></Field>
        <Field label="Unit cost ($)"><input name="unitCost" inputMode="decimal" defaultValue={part?.unitCostCents != null ? (part.unitCostCents / 100).toFixed(2) : ""} className={input} /></Field>
        <Field label="Lead time (days)"><input name="leadTimeDays" type="number" min={0} defaultValue={part?.leadTimeDays ?? ""} className={input} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="critical" defaultChecked={part?.critical} /> Critical part</label>
      <Field label="Notes"><textarea name="description" rows={2} defaultValue={part?.description ?? ""} className={input} /></Field>
      <button className={btn}>{submitLabel}</button>
    </form>
  );
}
