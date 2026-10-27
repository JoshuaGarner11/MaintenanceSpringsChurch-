import Link from "next/link";
import { canEdit, requireUser } from "@/lib/auth";
import { btnSecondary, Card, PageHeader, Section } from "@/components/ui";
import { Scanner } from "./scanner";

export default async function ScanPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Scan" />
      <Section title="Scan a QR label">
        <Scanner />
      </Section>
      {canEdit(user) && (
        <Section title="New equipment">
          <Card>
            <p className="mb-3 text-sm text-slate-600">Take a photo of the equipment and its nameplate, then fill in the details.</p>
            <Link href="/assets/new" className={btnSecondary}>Add asset with photo</Link>
          </Card>
        </Section>
      )}
    </>
  );
}
