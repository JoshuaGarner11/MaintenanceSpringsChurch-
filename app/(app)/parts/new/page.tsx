import { requireUser } from "@/lib/auth";
import { formOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { PartForm } from "@/components/part-form";
import { createPart } from "../actions";

export default async function NewPartPage() {
  await requireUser("ADMIN");
  return (
    <>
      <PageHeader title="New part" back="/parts" />
      <Card><PartForm action={createPart} options={await formOptions()} submitLabel="Add part" /></Card>
    </>
  );
}
