import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { Attachments } from "@/components/attachments";
import { ConfirmButton } from "@/components/confirm-button";
import { Select } from "@/components/select";
import { btn, btnDanger, btnSecondary, Card, Empty, Field, input, List, ListLink, PageHeader, Section } from "@/components/ui";
import { WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";
import { deleteLocation, updateLocation } from "../actions";

export const dynamic = "force-dynamic";

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const loc = await db.location.findUnique({
    where: { id: (await params).id },
    include: {
      parent: true,
      children: { orderBy: { name: "asc" } },
      assets: { orderBy: { name: "asc" } },
      attachments: true,
      workOrders: { include: workOrderRowInclude, orderBy: { number: "desc" }, take: 50 },
    },
  });
  if (!loc) notFound();
  const topLevel = user.role === "ADMIN" ? await db.location.findMany({ where: { parentId: null, NOT: { id: loc.id } }, orderBy: { name: "asc" } }) : [];
  return (
    <>
      <PageHeader title={loc.name} back={loc.parent ? `/locations/${loc.parent.id}` : "/locations"} />
      <Card className="mb-6">
        {loc.parent && <p className="mb-2 text-sm text-slate-500">In <Link className="text-brand-700" href={`/locations/${loc.parent.id}`}>{loc.parent.name}</Link></p>}
        {loc.description && <p className="mb-3 whitespace-pre-line text-slate-700">{loc.description}</p>}
        {canEdit(user) && <Link href={`/work-orders/new?locationId=${loc.id}`} className={btn}>+ Work order here</Link>}
      </Card>
      {loc.children.length > 0 && (
        <Section title="Rooms">
          <List>{loc.children.map((c) => <ListLink key={c.id} href={`/locations/${c.id}`}>{c.name}</ListLink>)}</List>
        </Section>
      )}
      {loc.assets.length > 0 && (
        <Section title="Assets">
          <List>{loc.assets.map((a) => <ListLink key={a.id} href={`/assets/${a.id}`}>{a.name}</ListLink>)}</List>
        </Section>
      )}
      {loc.attachments.length > 0 && (
        <Section title="Photos">
          <Attachments files={loc.attachments} />
        </Section>
      )}
      <Section title="Work history">
        {loc.workOrders.length === 0 ? <Empty>No work orders here yet.</Empty> : <List>{loc.workOrders.map((w) => <WorkOrderRow key={w.id} wo={w} />)}</List>}
      </Section>
      {user.role === "ADMIN" && (
        <Section title="Edit location">
          <Card>
            <form action={updateLocation.bind(null, loc.id)} className="space-y-3">
              <Field label="Name"><input name="name" defaultValue={loc.name} required className={input} /></Field>
              <Field label="Inside"><Select name="parentId" options={topLevel} value={loc.parentId} empty="Top-level area" /></Field>
              <Field label="Notes"><textarea name="description" defaultValue={loc.description ?? ""} rows={2} className={input} /></Field>
              <button className={btnSecondary}>Save</button>
            </form>
          </Card>
          <form action={deleteLocation.bind(null, loc.id)} className="mt-4 text-right">
            <ConfirmButton className={btnDanger} message={`Delete ${loc.name}? Anything in it moves up to ${loc.parent?.name ?? "no location"}.`}>Delete location</ConfirmButton>
          </form>
        </Section>
      )}
    </>
  );
}
