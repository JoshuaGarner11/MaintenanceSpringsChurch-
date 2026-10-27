import type { WorkOrder } from "@prisma/client";
import type { FormOptions } from "@/lib/options";
import { toDateInput } from "@/lib/format";
import { btn, Field, input } from "./ui";
import { Select } from "./select";

export function WorkOrderForm({
  action,
  options,
  wo,
  assigneeIds = [],
  defaults = {},
  submitLabel,
}: {
  action: (form: FormData) => Promise<void>;
  options: FormOptions;
  wo?: WorkOrder;
  assigneeIds?: string[];
  defaults?: { assetId?: string; locationId?: string; followUpOfId?: string };
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {defaults.followUpOfId && <input type="hidden" name="followUpOfId" value={defaults.followUpOfId} />}
      <Field label="What needs doing?">
        <input name="title" required defaultValue={wo?.title} className={input} placeholder="e.g. Leak in lobby by the welcome center" />
      </Field>
      <Field label="Details">
        <textarea name="description" rows={3} defaultValue={wo?.description ?? ""} className={input} />
      </Field>
      {!wo && (
        <Field label="Photos">
          <input name="photos" type="file" accept="image/*,application/pdf" multiple className="block w-full text-sm" />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <Select name="locationId" options={options.locations} value={wo?.locationId ?? defaults.locationId} />
        </Field>
        <Field label="Asset">
          <Select name="assetId" options={options.assets} value={wo?.assetId ?? defaults.assetId} />
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue={wo?.priority ?? "NONE"} className={input}>
            <option value="NONE">None</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </Field>
        <Field label="Due date">
          <input name="dueDate" type="date" defaultValue={toDateInput(wo?.dueDate)} className={input} />
        </Field>
        <Field label="Type">
          <select name="type" defaultValue={wo?.type ?? "REACTIVE"} className={input}>
            <option value="REACTIVE">Repair / one-off</option>
            <option value="PREVENTIVE">Preventive</option>
          </select>
        </Field>
        <Field label="Vendor">
          <Select name="vendorId" options={options.vendors} value={wo?.vendorId} />
        </Field>
        {!wo && (
          <Field label="Checklist">
            <Select name="checklistId" options={options.checklists} />
          </Field>
        )}
        <Field label="Categories" hint="Comma separated, e.g. Plumbing, Safety">
          <input name="categories" defaultValue={wo?.categories.join(", ")} className={input} />
        </Field>
      </div>
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-slate-700">Assign to</legend>
        <div className="flex flex-wrap gap-2">
          {options.users.map((u) => (
            <label key={u.id} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm has-checked:border-brand-600 has-checked:bg-brand-50">
              <input type="checkbox" name="assigneeIds" value={u.id} defaultChecked={assigneeIds.includes(u.id)} />
              {u.name}
            </label>
          ))}
        </div>
      </fieldset>
      <button className={`${btn} w-full sm:w-auto`}>{submitLabel}</button>
    </form>
  );
}
