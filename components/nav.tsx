"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./icon";

type Tab = { href: string; label: string; icon: IconName };

const tabs: Tab[] = [
  { href: "/", label: "Today", icon: "today" },
  { href: "/work-orders", label: "Work", icon: "work" },
  { href: "/scan", label: "Scan", icon: "scan" },
  { href: "/assets", label: "Assets", icon: "assets" },
  { href: "/more", label: "More", icon: "more" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

// Phone: a floating dock above the home indicator, with Scan as the raised centre button.
export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 print:hidden md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center rounded-[22px] border border-slate-200/70 bg-glass p-1.5 shadow-float backdrop-blur-xl backdrop-saturate-150">
        {tabs.map((t) => {
          const active = isActive(path, t.href);
          if (t.href === "/scan")
            return (
              <Link key={t.href} href={t.href} aria-label="Scan a QR code" className="flex justify-center">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-600 text-white shadow-float transition active:scale-95">
                  <Icon name="scan" className="h-6 w-6" />
                </span>
              </Link>
            );
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition ${active ? "text-brand-700" : "text-slate-500"}`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-brand-600/12" : ""}`}>
                <Icon name={t.icon} className="h-[22px] w-[22px]" />
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Phone: a slim title bar.
export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-glass pt-[env(safe-area-inset-top)] backdrop-blur-xl print:hidden md:hidden">
      <div className="flex h-12 items-center gap-2.5 px-4">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg" />
          Springs Maintenance
        </Link>
      </div>
    </header>
  );
}

const sideLinks: Tab[] = [
  { href: "/", label: "Today", icon: "today" },
  { href: "/work-orders", label: "Work orders", icon: "work" },
  { href: "/assets", label: "Assets", icon: "assets" },
  { href: "/locations", label: "Locations", icon: "locations" },
  { href: "/schedules", label: "Schedules", icon: "schedules" },
  { href: "/parts", label: "Parts", icon: "parts" },
  { href: "/checklists", label: "Checklists", icon: "checklists" },
  { href: "/vendors", label: "Vendors", icon: "vendors" },
  { href: "/overview", label: "Overview", icon: "overview" },
];

// Desktop: a quiet sidebar.
export function SideNav({ name, role }: { name: string; role: string }) {
  const path = usePathname();
  const item = (l: Tab) => {
    const active = isActive(path, l.href);
    return (
      <Link
        key={l.href}
        href={l.href}
        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition ${active ? "bg-surface text-slate-950 shadow-soft ring-1 ring-slate-200/80" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
      >
        <Icon name={l.icon} className={`h-[18px] w-[18px] ${active ? "text-brand-600" : "text-slate-400"}`} />
        {l.label}
      </Link>
    );
  };
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-slate-200/70 px-3 py-5 print:hidden md:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-3">
        <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight">Springs</div>
          <div className="text-xs text-slate-500">Maintenance</div>
        </div>
      </Link>
      {role !== "VIEWER" && (
      <Link href="/work-orders/new" className="mb-5 inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-600 text-sm font-medium text-white shadow-soft transition hover:brightness-110">
        <Icon name="plus" className="h-4 w-4" /> New work order
      </Link>
      )}
      <nav className="flex flex-1 flex-col gap-0.5">{sideLinks.map(item)}</nav>
      <div className="flex flex-col gap-0.5 border-t border-slate-200/70 pt-3">
        {item({ href: "/scan", label: "Scan", icon: "scan" })}
        {item({ href: "/more", label: "Settings & more", icon: "more" })}
        <div className="mt-2 flex items-center gap-2.5 px-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
            {name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="text-xs text-slate-500 capitalize">{role.toLowerCase()}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
