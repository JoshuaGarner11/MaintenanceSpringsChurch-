import type { PmSchedule } from "@prisma/client";
import type { FormOptions } from "@/lib/options";
import { toDateInput } from "@/lib/format";
import { btn, Field, input, inputBase } from "./ui";
import { Select } from "./select";

export function ScheduleForm({ action, options, s, submitLabel }: { action: (f: FormData) => Promise<void>; options: FormOptions; s?: PmSchedule; submitLabel: string }) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Title"><input name="title" required defaultValue={s?.title} className={input} placeholder="e.g. Annual fire alarm inspection" /></Field>
      <Field label="Instructions"><textarea name="description" rows={2} defaultValue={s?.description ?? ""} className={input} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Repeats every">
          <div className="flex gap-2">
            <input name="every" type="number" min={1} defaultValue={s?.every ?? 1} className={`${inputBase} w-20 shrink-0`} />
            <select name="unit" defaultValue={s?.unit ?? "YEAR"} className={input}>
              <option value="DAY">day(s)</option>
              <option value="WEEK">week(s)</option>
              <option value="MONTH">month(s)</option>
              <option value="YEAR">year(s)</option>
            </select>
          </div>
        </Field>
        <Field label="Next due"><input name="nextDue" type="date" required defaultValue={toDateInput(s?.nextDue)} className={input} /></Field>
        <Field label="Create the work order" hint="Days before it's due">
          <input name="leadDays" type="number" min={0} defaultValue={s?.leadDays ?? 14} className={input} />
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue={s?.priority ?? "MEDIUM"} className={input}>
            <option value="NONE">None</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </select>
        </Field>
        <Field label="Asset"><Select name="assetId" options={options.assets} value={s?.assetId} /></Field>
        <Field label="Location"><Select name="locationId" options={options.locations} value={s?.locationId} /></Field>
        <Field label="Assign to"><Select name="assigneeId" options={options.users} value={s?.assigneeId} empty="Nobody" /></Field>
        <Field label="Vendor"><Select name="vendorId" options={options.vendors} value={s?.vendorId} /></Field>
        <Field label="Checklist"><Select name="checklistId" options={options.checklists} value={s?.checklistId} /></Field>
        <Field label="Categories"><input name="categories" defaultValue={s?.categories.join(", ")} className={input} placeholder="Inspection, Safety" /></Field>
      </div>
      {s && (
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="active" value="off" />
          <input type="checkbox" name="active" value="on" defaultChecked={s.active} /> Active
        </label>
      )}
      <button className={btn}>{submitLabel}</button>
    </form>
  );
}
