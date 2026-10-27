import Link from "next/link";
import { notFound } from "next/navigation";
import type { WorkStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { canEdit, requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney } from "@/lib/format";
import { describeRepeat } from "@/lib/recurrence";
import { Attachments } from "@/components/attachments";
import { ConfirmButton } from "@/components/confirm-button";
import { btn, btnDanger, btnSecondary, Card, Empty, Field, input, inputBase, PageHeader, PriorityBadge, Section, StatusBadge } from "@/components/ui";
import { Select } from "@/components/select";
import {
  addComment,
  completeWorkOrder,
  createFollowUp,
  deleteWorkOrder,
  logPartUsed,
  saveChecklist,
  setStatus,
  undoPartUsage,
} from "../actions";

export const dynamic = "force-dynamic";

const choiceStyle: Record<string, string> = {
  PASS: "has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-800",
  FAIL: "has-checked:border-red-600 has-checked:bg-red-50 has-checked:text-red-800",
  FLAG: "has-checked:border-amber-600 has-checked:bg-amber-50 has-checked:text-amber-800",
};

export default async function WorkOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const user = await requireUser();
  const number = Number((await params).number);
  const wo = Number.isInteger(number)
    ? await db.workOrder.findUnique({
        where: { number },
        include: {
          asset: true,
          location: { include: { parent: true } },
          vendor: true,
          schedule: true,
          assignees: { include: { user: true } },
          answers: { orderBy: { position: "asc" } },
          partsUsed: { include: { part: true }, orderBy: { createdAt: "asc" } },
          comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
          attachments: { orderBy: { createdAt: "asc" } },
          followUpOf: { select: { number: true, title: true } },
          followUps: { select: { number: true, title: true, status: true } },
          completedBy: true,
          createdBy: true,
        },
      })
    : null;
  if (!wo) notFound();
  const editable = canEdit(user);
  const parts = editable ? await db.part.findMany({ select: { id: true, name: true, inStock: true }, orderBy: { name: "asc" } }) : [];
  const failed = wo.answers.filter((a) => a.value === "FAIL" || a.value === "FLAG");
  const done = wo.status === "DONE";

  const meta: [string, React.ReactNode][] = [
    ["Asset", wo.asset && <Link className="text-brand-700" href={`/assets/${wo.asset.id}`}>{wo.asset.name}</Link>],
    ["Location", wo.location && <Link className="text-brand-700" href={`/locations/${wo.location.id}`}>{wo.location.parent ? `${wo.location.parent.name} › ` : ""}{wo.location.name}</Link>],
    ["Due", fmtDate(wo.dueDate)],
    ["Assigned", wo.assignees.map((a) => a.user.name).join(", ")],
    ["Vendor", wo.vendor?.name],
    ["Repeats", wo.schedule && <Link className="text-brand-700" href={`/schedules/${wo.schedule.id}`}>{describeRepeat(wo.schedule.every, wo.schedule.unit)}</Link>],
    ["Type", wo.type === "PREVENTIVE" ? "Preventive" : "Repair / one-off"],
    ["Categories", wo.categories.join(", ")],
    ["Created", `${fmtDate(wo.createdAt)}${wo.createdBy ? ` by ${wo.createdBy.name}` : ""}`],
    ["Completed", done && `${fmtDate(wo.completedAt)}${wo.completedBy ? ` by ${wo.completedBy.name}` : ""}`],
    ["Time spent", wo.minutesSpent > 0 && `${(wo.minutesSpent / 60).toFixed(1)} h`],
    ["Outside costs", wo.otherCostCents > 0 && fmtMoney(wo.otherCostCents)],
  ];

  const statusButton = (status: WorkStatus, text: string) =>
    wo.status !== status && (
      <form action={setStatus.bind(null, wo.id, status)}>
        <button className={btnSecondary}>{text}</button>
      </form>
    );

  return (
    <>
      <PageHeader
        title={`#${wo.number}`}
        back="/work-orders"
        action={editable && <Link href={`/work-orders/${wo.number}/edit`} className={btnSecondary}>Edit</Link>}
      />
      <Card className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge status={wo.status} />
          <PriorityBadge priority={wo.priority} />
        </div>
        <h2 className="mb-2 text-lg font-semibold">{wo.title}</h2>
        {wo.description && <p className="mb-3 whitespace-pre-line text-slate-700">{wo.description}</p>}
        {wo.followUpOf && (
          <p className="mb-3 text-sm">
            Follow-up from <Link className="text-brand-700" href={`/work-orders/${wo.followUpOf.number}`}>#{wo.followUpOf.number} {wo.followUpOf.title}</Link>
          </p>
        )}
        <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
          {meta
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-slate-500">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
        {editable && !done && (
          <div className="mt-4 flex flex-wrap gap-2">
            {statusButton("IN_PROGRESS", "Start")}
            {statusButton("ON_HOLD", "On hold")}
          </div>
        )}
        {editable && done && <div className="mt-4">{statusButton("OPEN", "Reopen")}</div>}
      </Card>

      {wo.answers.length > 0 && (
        <Section title="Checklist">
          <Card>
            <form action={saveChecklist.bind(null, wo.id)} className="space-y-4">
              {wo.answers.map((a) => (
                <div key={a.id} className="border-b border-slate-100 pb-3 last:border-0">
                  <div className="mb-2 font-medium">{a.label}</div>
                  {a.kind === "PASS_FAIL" && (
                    <div className="flex gap-2">
                      {["PASS", "FAIL", "FLAG"].map((v) => (
                        <label
                          key={v}
                          className={`flex-1 cursor-pointer rounded-lg border border-slate-300 py-2 text-center text-sm has-checked:font-semibold ${choiceStyle[v]}`}
                        >
                          <input type="radio" name={`value-${a.id}`} value={v} defaultChecked={a.value === v} disabled={!editable} className="sr-only" />
                          {v[0] + v.slice(1).toLowerCase()}
                        </label>
                      ))}
                    </div>
                  )}
                  {a.kind === "CHECKBOX" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name={`value-${a.id}`} defaultChecked={a.value === "yes"} disabled={!editable} className="h-5 w-5" />
                      Done
                    </label>
                  )}
                  {a.kind === "NUMBER" && <input name={`value-${a.id}`} inputMode="decimal" defaultValue={a.value ?? ""} disabled={!editable} className={input} />}
                  {a.kind === "TEXT" && <input name={`value-${a.id}`} defaultValue={a.value ?? ""} disabled={!editable} className={input} />}
                  <input name={`note-${a.id}`} defaultValue={a.note ?? ""} placeholder="Note (optional)" disabled={!editable} className={`${input} mt-2 text-sm`} />
                </div>
              ))}
              {editable && <button className={btn}>Save checklist</button>}
            </form>
          </Card>
          {failed.length > 0 && (
            <Card className="mt-3 border-red-200 bg-red-50">
              <p className="mb-2 text-sm font-medium text-red-800">
                {failed.length} item{failed.length > 1 ? "s" : ""} failed or flagged.
              </p>
              {wo.followUps.length > 0 ? (
                <ul className="text-sm">
                  {wo.followUps.map((f) => (
                    <li key={f.number}>
                      Repair: <Link className="text-brand-700" href={`/work-orders/${f.number}`}>#{f.number} {f.title}</Link> <StatusBadge status={f.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                editable && (
                  <form action={createFollowUp.bind(null, wo.id)}>
                    <button className={btn}>Create repair work order</button>
                  </form>
                )
              )}
            </Card>
          )}
        </Section>
      )}

      <Section title="Parts used">
        {wo.partsUsed.length === 0 && !editable && <Empty>None.</Empty>}
        {wo.partsUsed.length > 0 && (
          <Card className="mb-2">
            <ul className="space-y-1 text-sm">
              {wo.partsUsed.map((u) => (
                <li key={u.id} className="flex items-center justify-between">
                  <span>{u.quantity} × {u.part.name}</span>
                  {editable && (
                    <form action={undoPartUsage.bind(null, u.id)}>
                      <button className="text-xs text-slate-500 underline">Undo</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}
        {editable && parts.length > 0 && (
          <form action={logPartUsed.bind(null, wo.id)} className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Select name="partId" options={parts.map((p) => ({ id: p.id, name: `${p.name} (${p.inStock} in stock)` }))} empty="Choose a part" required />
            </div>
            <input name="quantity" type="number" min={1} defaultValue={1} className={`${inputBase} w-20 shrink-0`} />
            <button className={btnSecondary}>Add</button>
          </form>
        )}
      </Section>

      <Section title="Photos and files">
        <Attachments files={wo.attachments} />
      </Section>

      <Section title="Notes">
        <div className="mb-3 space-y-2">
          {wo.comments.map((c) => (
            <Card key={c.id} className="py-3">
              <div className="mb-1 text-xs text-slate-500">
                {c.user?.name ?? "Someone"} · {fmtDate(c.createdAt)}
              </div>
              <p className="whitespace-pre-line text-sm">{c.body}</p>
            </Card>
          ))}
        </div>
        {editable && (
          <form action={addComment.bind(null, wo.id)} className="space-y-2">
            <textarea name="body" rows={2} placeholder="Add a note" className={input} />
            <div className="flex items-center gap-2">
              <input name="photos" type="file" accept="image/*,application/pdf" multiple className="min-w-0 flex-1 text-sm" />
              <button className={btnSecondary}>Add</button>
            </div>
          </form>
        )}
      </Section>

      {editable && !done && (
        <Section title="Finish">
          <Card>
            <form action={completeWorkOrder.bind(null, wo.id)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hours spent">
                  <input name="hours" inputMode="decimal" placeholder="0.5" className={input} />
                </Field>
                <Field label="Outside costs ($)">
                  <input name="otherCost" inputMode="decimal" placeholder="0" className={input} />
                </Field>
              </div>
              <textarea name="note" rows={2} placeholder="What was done (optional)" className={input} />
              <button className={`${btn} w-full`}>Mark done</button>
            </form>
          </Card>
        </Section>
      )}

      {user.role === "ADMIN" && (
        <form action={deleteWorkOrder.bind(null, wo.id)} className="mt-8 text-right">
          <ConfirmButton className={btnDanger} message={`Delete work order #${wo.number}? This can't be undone.`}>Delete work order</ConfirmButton>
        </form>
      )}
    </>
  );
}
