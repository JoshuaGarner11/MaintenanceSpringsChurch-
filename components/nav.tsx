"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Today", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/work-orders", label: "Work orders", icon: "M9 5h6m-6 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-6 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12l2 2 4-4" },
  { href: "/assets", label: "Assets", icon: "M20 7 12 3 4 7m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { href: "/scan", label: "Scan", icon: "M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3m0 8v3a1 1 0 0 1-1 1h-3m-8 0H5a1 1 0 0 1-1-1v-3M8 12h8" },
  { href: "/more", label: "More", icon: "M5 12h.01M12 12h.01M19 12h.01" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 print:hidden border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${isActive(path, t.href) ? "text-brand-700" : "text-slate-500"}`}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const desktopLinks = [
  { href: "/", label: "Today" },
  { href: "/work-orders", label: "Work orders" },
  { href: "/assets", label: "Assets" },
  { href: "/locations", label: "Locations" },
  { href: "/schedules", label: "Schedules" },
  { href: "/parts", label: "Parts" },
  { href: "/overview", label: "Overview" },
  { href: "/more", label: "More" },
];

export function TopNav({ name }: { name: string }) {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-20 print:hidden border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <img src="/icon.svg" alt="" className="h-7 w-7" />
          <span>Springs Maintenance</span>
        </Link>
        <nav className="hidden flex-1 gap-1 md:flex">
          {desktopLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm ${isActive(path, l.href) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="ml-auto hidden text-sm text-slate-500 md:inline">{name}</span>
      </div>
    </header>
  );
}
