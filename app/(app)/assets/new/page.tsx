import { requireUser } from "@/lib/auth";
import { formOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { AssetForm } from "@/components/asset-form";
import { createAsset } from "../actions";

export default async function NewAssetPage() {
  await requireUser("ADMIN", "TECHNICIAN");
  return (
    <>
      <PageHeader title="New asset" back="/assets" />
      <Card>
        <AssetForm action={createAsset} options={await formOptions()} submitLabel="Add asset" />
      </Card>
    </>
  );
}
