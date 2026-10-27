import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btnSecondary, Card, Empty, input, List, ListLink, PageHeader } from "@/components/ui";
import { createChecklist } from "./actions";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  const user = await requireUser();
  const templates = await db.checklistTemplate.findMany({ include: { _count: { select: { items: true } } }, orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader title="Checklists" back="/more" />
      {templates.length === 0 ? (
        <Empty>No checklists yet.</Empty>
      ) : (
        <List>
          {templates.map((t) => (
            <ListLink key={t.id} href={`/checklists/${t.id}`}>
              <div className="flex justify-between"><span>{t.name}</span><span className="text-sm text-slate-500">{t._count.items} items</span></div>
            </ListLink>
          ))}
        </List>
      )}
      {user.role === "ADMIN" && (
        <Card className="mt-6">
          <form action={createChecklist} className="flex gap-2">
            <input name="name" placeholder="New checklist name" required className={input} />
            <button className={btnSecondary}>Create</button>
          </form>
        </Card>
      )}
    </>
  );
}
