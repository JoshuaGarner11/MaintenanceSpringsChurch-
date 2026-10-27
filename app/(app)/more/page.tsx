import { requireUser } from "@/lib/auth";
import { List, ListLink, PageHeader } from "@/components/ui";
import { signOutAction } from "@/app/login/actions";

export default async function MorePage() {
  const user = await requireUser();
  const links: [string, string, boolean][] = [
    ["/locations", "Locations", true],
    ["/schedules", "Repeating schedules", true],
    ["/parts", "Parts", true],
    ["/vendors", "Vendors", true],
    ["/checklists", "Checklists", true],
    ["/overview", "Overview", user.role !== "TECHNICIAN"],
    ["/users", "People", user.role === "ADMIN"],
  ];
  return (
    <>
      <PageHeader title="More" />
      <List>
        {links.filter(([, , show]) => show).map(([href, text]) => (
          <ListLink key={href} href={href}>{text}</ListLink>
        ))}
      </List>
      <p className="mt-6 text-center text-sm text-slate-500">
        Signed in as {user.name} ({user.email})
      </p>
      <form action={signOutAction} className="mt-2 text-center">
        <button className="text-sm text-slate-600 underline">Sign out</button>
      </form>
    </>
  );
}
