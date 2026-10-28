import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { fmtDate, label } from "@/lib/format";
import { describeRepeat } from "@/lib/recurrence";
import { Attachments } from "@/components/attachments";
import { ConfirmButton } from "@/components/confirm-button";
import { Badge, btn, btnDanger, btnSecondary, Card, Empty, List, ListLink, PageHeader, Section } from "@/components/ui";
import { WorkOrderRow, workOrderRowInclude } from "@/components/work-order-row";
import { approveAsset, deleteAsset } from "../actions";

export const dynamic = "force-dynamic";

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const asset = await db.asset.findUnique({
    where: { id: (await params).id },
    include: {
      location: { include: { parent: true } },
      parent: true,
      children: { orderBy: { name: "asc" } },
      vendor: true,
      attachments: { orderBy: { createdAt: "desc" } },
      schedules: { where: { active: true }, orderBy: { nextDue: "asc" } },
      parts: { orderBy: { name: "asc" } },
      workOrders: { include: workOrderRowInclude, orderBy: [{ completedAt: { sort: "desc", nulls: "first" } }, { number: "desc" }] },
    },
  });
  if (!asset) notFound();
  const editable = canEdit(user);
  const facts: [string, React.ReactNode][] = [
    ["Location", asset.location && <Link className="text-brand-700" href={`/locations/${asset.location.id}`}>{asset.location.parent ? `${asset.location.parent.name} › ` : ""}{asset.location.name}</Link>],
    ["Part of", asset.parent && <Link className="text-brand-700" href={`/assets/${asset.parent.id}`}>{asset.parent.name}</Link>],
    ["Manufacturer", asset.manufacturer],
    ["Model", asset.model],
    ["Serial", asset.serialNumber],
    ["Year", asset.year],
    ["Type", asset.type],
    ["Vendor", asset.vendor?.name],
    ["Criticality", label(asset.criticality)],
  ];
  return (
    <>
      <PageHeader
        title={asset.name}
        back="/assets"
        action={editable && <Link href={`/assets/${asset.id}/edit`} className={btnSecondary}>Edit</Link>}
      />
      {asset.needsReview && (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">Added by a volunteer and waiting for an admin to check the details.</p>
          {user.role === "ADMIN" && (
            <form action={approveAsset.bind(null, asset.id)} className="mt-2">
              <button className={btn}>Looks right</button>
            </form>
          )}
        </Card>
      )}
      <Card className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge tone={asset.status === "DOWN" ? "red" : "green"}>{asset.status === "DOWN" ? "Down" : "Working"}</Badge>
        </div>
        {asset.description && <p className="mb-3 whitespace-pre-line text-slate-700">{asset.description}</p>}
        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
          {facts
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          {editable && <Link href={`/work-orders/new?assetId=${asset.id}${asset.locationId ? `&locationId=${asset.locationId}` : ""}`} className={btn}>+ Work order</Link>}
          <Link href={`/assets/${asset.id}/label`} className={btnSecondary}>QR label</Link>
        </div>
      </Card>

      {asset.children.length > 0 && (
        <Section title="Includes">
          <List>
            {asset.children.map((c) => (
              <ListLink key={c.id} href={`/assets/${c.id}`}>{c.name}</ListLink>
            ))}
          </List>
        </Section>
      )}

      <Section title="Photos and files">
        <Attachments files={asset.attachments} />
      </Section>

      {asset.schedules.length > 0 && (
        <Section title="Repeating work">
          <List>
            {asset.schedules.map((s) => (
              <ListLink key={s.id} href={`/schedules/${s.id}`}>
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{s.title}</span>
                  <span className="text-sm text-slate-500">{describeRepeat(s.every, s.unit)} · next {fmtDate(s.nextDue)}</span>
                </div>
              </ListLink>
            ))}
          </List>
        </Section>
      )}

      {asset.parts.length > 0 && (
        <Section title="Parts">
          <List>
            {asset.parts.map((p) => (
              <ListLink key={p.id} href={`/parts/${p.id}`}>
                <div className="flex justify-between"><span>{p.name}</span><span className="text-sm text-slate-500">{p.inStock} in stock</span></div>
              </ListLink>
            ))}
          </List>
        </Section>
      )}

      <Section title={`Work history (${asset.workOrders.length})`}>
        {asset.workOrders.length === 0 ? (
          <Empty>No work orders yet.</Empty>
        ) : (
          <List>
            {asset.workOrders.map((w) => (
              <WorkOrderRow key={w.id} wo={w} />
            ))}
          </List>
        )}
      </Section>

      {user.role === "ADMIN" && (
        <form action={deleteAsset.bind(null, asset.id)} className="mt-8 text-right">
          <ConfirmButton className={btnDanger} message={`Delete ${asset.name}? Its work history stays but is no longer linked.`}>
            Delete asset
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
