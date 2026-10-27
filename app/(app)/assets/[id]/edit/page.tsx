import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { AssetForm } from "@/components/asset-form";
import { updateAsset } from "../../actions";

export default async function EditAssetPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("ADMIN", "TECHNICIAN");
  const asset = await db.asset.findUnique({ where: { id: (await params).id } });
  if (!asset) notFound();
  return (
    <>
      <PageHeader title={`Edit ${asset.name}`} back={`/assets/${asset.id}`} />
      <Card>
        <AssetForm action={updateAsset.bind(null, asset.id)} options={await formOptions()} asset={asset} submitLabel="Save changes" />
      </Card>
    </>
  );
}
