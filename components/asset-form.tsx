import type { Asset } from "@prisma/client";
import type { FormOptions } from "@/lib/options";
import { btn, Field, input } from "./ui";
import { Select } from "./select";

export function AssetForm({
  action,
  options,
  asset,
  submitLabel,
}: {
  action: (form: FormData) => Promise<void>;
  options: FormOptions;
  asset?: Asset;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      <Field label="Name">
        <input name="name" required defaultValue={asset?.name} className={input} placeholder="e.g. Rooftop AC unit 2" />
      </Field>
      <Field label="Photos">
        <input name="photos" type="file" accept="image/*" capture="environment" multiple className="block w-full text-sm" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location">
          <Select name="locationId" options={options.locations} value={asset?.locationId} />
        </Field>
        <Field label="Part of" hint="e.g. a horn strobe is part of Fire Alarms">
          <Select name="parentId" options={options.assets.filter((a) => a.id !== asset?.id)} value={asset?.parentId} />
        </Field>
        <Field label="Manufacturer">
          <input name="manufacturer" defaultValue={asset?.manufacturer ?? ""} className={input} />
        </Field>
        <Field label="Model">
          <input name="model" defaultValue={asset?.model ?? ""} className={input} />
        </Field>
        <Field label="Serial number">
          <input name="serialNumber" defaultValue={asset?.serialNumber ?? ""} className={input} />
        </Field>
        <Field label="Year">
          <input name="year" defaultValue={asset?.year ?? ""} className={input} />
        </Field>
        <Field label="Type" hint="e.g. Safety, HVAC, Plumbing">
          <input name="type" defaultValue={asset?.type ?? ""} className={input} />
        </Field>
        <Field label="Vendor">
          <Select name="vendorId" options={options.vendors} value={asset?.vendorId} />
        </Field>
        <Field label="Criticality">
          <select name="criticality" defaultValue={asset?.criticality ?? "NORMAL"} className={input}>
            <option value="NORMAL">Normal</option>
            <option value="IMPORTANT">Important</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={asset?.status ?? "WORKING"} className={input}>
            <option value="WORKING">Working</option>
            <option value="DOWN">Down</option>
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <textarea name="description" rows={3} defaultValue={asset?.description ?? ""} className={input} />
      </Field>
      <button className={`${btn} w-full sm:w-auto`}>{submitLabel}</button>
    </form>
  );
}
