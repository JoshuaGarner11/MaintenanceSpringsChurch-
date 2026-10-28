import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ConfirmButton } from "@/components/confirm-button";
import { btn, btnDanger, Card, PageHeader } from "@/components/ui";
import { VendorFields } from "@/components/vendor-fields";
import { deleteVendor, updateVendor } from "../../parts/actions";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("ADMIN");
  const vendor = await db.vendor.findUnique({ where: { id: (await params).id } });
  if (!vendor) notFound();
  return (
    <>
      <PageHeader title={`Edit ${vendor.name}`} back="/vendors" />
      <Card>
        <form action={updateVendor.bind(null, vendor.id)} className="space-y-3">
          <VendorFields vendor={vendor} />
          <button className={btn}>Save</button>
        </form>
      </Card>
      <form action={deleteVendor.bind(null, vendor.id)} className="mt-4 text-right">
        <ConfirmButton className={btnDanger} message={`Delete ${vendor.name}?`}>Delete vendor</ConfirmButton>
      </form>
    </>
  );
}
