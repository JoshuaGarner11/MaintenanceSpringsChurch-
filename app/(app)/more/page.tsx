import { requireUser } from "@/lib/auth";
import { Icon, type IconName } from "@/components/icon";
import { Card, List, ListLink, PageHeader, Section } from "@/components/ui";
import { PushToggle } from "@/components/push-toggle";
import { vapidPublicKey } from "@/lib/notify";
import { tvUrl } from "@/lib/tv";
import { signOutAction } from "@/app/login/actions";

export default async function MorePage() {
  const user = await requireUser();
  const links: [string, string, IconName, boolean][] = [
    ["/locations", "Locations", "locations", true],
    ["/schedules", "Repeating schedules", "schedules", true],
    ["/parts", "Parts", "parts", true],
    ["/vendors", "Vendors", "vendors", true],
    ["/checklists", "Checklists", "checklists", true],
    ["/overview", "Overview", "overview", user.role !== "TECHNICIAN"],
    ["/users", "People", "people", user.role === "ADMIN"],
  ];
  return (
    <>
      <PageHeader title="More" />
      <List>
        {links.filter(([, , , show]) => show).map(([href, text, icon]) => (
          <ListLink key={href} href={href}>
            <span className="flex items-center gap-3 font-medium">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name={icon} className="h-[18px] w-[18px]" /></span>
              {text}
            </span>
          </ListLink>
        ))}
      </List>
      {user.role === "ADMIN" && (
        <div className="mt-8">
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
              <a href="/art" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700"><Icon name="art" className="h-4 w-4" />Paintings on the TV</a>
            </Card>
          </Section>
        </div>
      )}
      <Card className="mt-8 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
          {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-medium">{user.name}</div>
          <div className="truncate text-sm text-slate-500">{user.email}</div>
        </div>
        <form action={signOutAction}>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50">
            <Icon name="signout" className="h-4 w-4" />Sign out
          </button>
        </form>
      </Card>
    </>
  );
}
