import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { btn, btnSecondary, Card, Field, input, PageHeader, Section } from "@/components/ui";
import { inviteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

const RoleSelect = ({ value, disabled }: { value?: string; disabled?: boolean }) => (
  <select name="role" defaultValue={value ?? "TECHNICIAN"} disabled={disabled} className={input}>
    <option value="ADMIN">Admin: everything</option>
    <option value="TECHNICIAN">Technician: does the work</option>
    <option value="VIEWER">Viewer: read only</option>
  </select>
);

export default async function UsersPage() {
  const me = await requireUser("ADMIN");
  const users = await db.user.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title="People" back="/more" />
      <div className="space-y-3">
        {users.map((u) => (
          <Card key={u.id} className={u.active ? "" : "opacity-60"}>
            <form action={updateUser.bind(null, u.id)} className="grid items-end gap-2 sm:grid-cols-[1fr_1.4fr_1fr_auto_auto]">
              <Field label="Name"><input name="name" defaultValue={u.name} className={input} /></Field>
              <Field label="Email"><input name="email" type="email" defaultValue={u.email} className={`${input} ${u.email.endsWith(".invalid") ? "border-amber-400 bg-amber-50" : ""}`} /></Field>
              <Field label="Role"><RoleSelect value={u.role} disabled={u.id === me.id} /></Field>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} /> Active
              </label>
              <button className={btnSecondary}>Save</button>
            </form>
          </Card>
        ))}
      </div>
      <Section title="Add someone">
        <Card className="mt-2">
          <form action={inviteUser} className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><input name="name" required className={input} /></Field>
            <Field label="Email"><input name="email" type="email" required className={input} /></Field>
            <Field label="Role"><RoleSelect /></Field>
            <div className="flex items-end"><button className={btn}>Add and email them</button></div>
          </form>
        </Card>
      </Section>
    </>
  );
}
