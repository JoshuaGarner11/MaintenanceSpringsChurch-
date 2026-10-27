import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ConfirmButton } from "@/components/confirm-button";
import { btn, btnDanger, Card, Field, input, inputBase, PageHeader } from "@/components/ui";
import { deleteChecklist, saveChecklist } from "../actions";

const kindLabel = { CHECKBOX: "Checkbox", PASS_FAIL: "Pass / Fail / Flag", NUMBER: "Number", TEXT: "Text" };

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const t = await db.checklistTemplate.findUnique({ where: { id: (await params).id }, include: { items: { orderBy: { position: "asc" } } } });
  if (!t) notFound();
  if (user.role !== "ADMIN") {
    return (
      <>
        <PageHeader title={t.name} back="/checklists" />
        <Card>
          <ol className="list-decimal space-y-1 pl-5">
            {t.items.map((i) => <li key={i.id}>{i.label} <span className="text-sm text-slate-500">({kindLabel[i.kind]})</span></li>)}
          </ol>
        </Card>
      </>
    );
  }
  const rows = [...t.items.map((i) => ({ key: i.id, label: i.label, kind: i.kind })), ...[0, 1, 2].map((n) => ({ key: `new-${n}`, label: "", kind: "PASS_FAIL" as const }))];
  return (
    <>
      <PageHeader title={t.name} back="/checklists" />
      <Card>
        <form action={saveChecklist.bind(null, t.id)} className="space-y-4">
          <Field label="Name"><input name="name" defaultValue={t.name} required className={input} /></Field>
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Items (clear an item's text to remove it)</div>
            {rows.map((r, i) => (
              <div key={r.key} className="flex gap-2">
                <span className="w-6 pt-2 text-right text-sm text-slate-400">{i + 1}</span>
                <input name="label" defaultValue={r.label} placeholder="New item" className={input} />
                <select name="kind" defaultValue={r.kind} className={`${inputBase} shrink-0 w-44`}>
                  {Object.entries(kindLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button className={btn}>Save checklist</button>
        </form>
      </Card>
      <form action={deleteChecklist.bind(null, t.id)} className="mt-4 text-right">
        <ConfirmButton className={btnDanger} message={`Delete the ${t.name} checklist? Past work orders keep their answers.`}>Delete checklist</ConfirmButton>
      </form>
    </>
  );
}
