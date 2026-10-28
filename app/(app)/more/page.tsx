import { requireUser } from "@/lib/auth";
import { Card, List, ListLink, PageHeader, Section } from "@/components/ui";
import { PushToggle } from "@/components/push-toggle";
import { vapidPublicKey } from "@/lib/notify";
import { tvUrl } from "@/lib/tv";
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
      {user.role === "ADMIN" && (
        <div className="mt-6">
          <Section title="Problem report alerts">
            <Card>
              <PushToggle publicKey={vapidPublicKey()} />
            </Card>
          </Section>
          <Section title="Office TV">
            <Card>
              {tvUrl() ? (
                <>
                  <p className="mb-2 text-sm text-slate-600">Open this link on the TV&apos;s browser and make it full screen. Anyone with the link can see the board, so keep it private.</p>
                  <a href="/tv" className="text-sm break-all text-brand-700 underline">{tvUrl()}</a>
                </>
              ) : (
                <p className="text-sm text-slate-600">Set TV_KEY in the server settings to get a sign-in-free link for the office TV. <a href="/tv" className="text-brand-700 underline">Preview the board</a></p>
              )}
            </Card>
          </Section>
        </div>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        Signed in as {user.name} ({user.email})
      </p>
      <form action={signOutAction} className="mt-2 text-center">
        <button className="text-sm text-slate-600 underline">Sign out</button>
      </form>
    </>
  );
}
