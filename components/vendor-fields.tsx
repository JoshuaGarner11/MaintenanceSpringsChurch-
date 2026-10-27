import type { Vendor } from "@prisma/client";
import { Field, input } from "./ui";

export function VendorFields({ vendor }: { vendor?: Vendor }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Company"><input name="name" required defaultValue={vendor?.name} className={input} /></Field>
      <Field label="Contact name"><input name="contactName" defaultValue={vendor?.contactName ?? ""} className={input} /></Field>
      <Field label="Email"><input name="email" type="email" defaultValue={vendor?.email ?? ""} className={input} /></Field>
      <Field label="Phone"><input name="phone" type="tel" defaultValue={vendor?.phone ?? ""} className={input} /></Field>
      <div className="sm:col-span-2"><Field label="Notes"><textarea name="notes" rows={2} defaultValue={vendor?.notes ?? ""} className={input} /></Field></div>
    </div>
  );
}
