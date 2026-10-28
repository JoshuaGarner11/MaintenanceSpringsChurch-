import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btnSecondary, Card, Empty, PageHeader, Section } from "@/components/ui";
import { VendorFields } from "@/components/vendor-fields";
import { createVendor } from "../parts/actions";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const user = await requireUser();
  const vendors = await db.vendor.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Vendors" back="/parts" />
      {vendors.length === 0 && <Empty>No vendors yet.</Empty>}
      <div className="space-y-3">
        {vendors.map((v) => (
          <Card key={v.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{v.name}</div>
                {v.contactName && <div className="text-sm text-slate-600">{v.contactName}</div>}
                <div className="mt-1 flex flex-wrap gap-x-4 text-sm">
                  {v.phone && <a className="text-brand-700" href={`tel:${v.phone}`}>{v.phone}</a>}
                  {v.email && <a className="text-brand-700" href={`mailto:${v.email}`}>{v.email}</a>}
                </div>
                {v.notes && <p className="mt-1 text-sm text-slate-500">{v.notes}</p>}
              </div>
              {user.role === "ADMIN" && <Link href={`/vendors/${v.id}`} className="text-sm text-slate-500 underline">Edit</Link>}
            </div>
          </Card>
        ))}
      </div>
      {user.role === "ADMIN" && (
        <Section title="Add a vendor">
          <Card className="mt-2">
            <form action={createVendor} className="space-y-3">
              <VendorFields />
              <button className={btnSecondary}>Add vendor</button>
            </form>
          </Card>
        </Section>
      )}
    </>
  );
}
