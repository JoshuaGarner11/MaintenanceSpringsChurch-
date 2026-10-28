// A small set of line icons (24px grid, 1.75 stroke) so the app has no icon dependency to keep up to date.
const paths = {
  today: "M8 3v3m8-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm3 9 2 2 4-4",
  work: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 8 2 2 4-4",
  assets: "M20 7.5 12 3 4 7.5m16 0-8 4.5m8-4.5v9L12 21m0-9L4 7.5m8 4.5v9m-8-13.5v9L12 21",
  scan: "M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2m0 8v2a2 2 0 0 1-2 2h-2m-8 0H6a2 2 0 0 1-2-2v-2M4 12h16",
  more: "M4 6h16M4 12h16M4 18h16",
  locations: "M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  schedules: "M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4M12 8v4l2.5 2.5",
  parts: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a1.4 1.4 0 0 0 2 2l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.4Z",
  overview: "M4 20V10m5.33 10V4m5.34 16v-7M20 20V8",
  vendors: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01",
  checklists: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  people: "M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m16 0v-1a4 4 0 0 0-3-3.87M14 4.13a4 4 0 0 1 0 7.75M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  art: "M4 5h16v14H4zM4 15l4.5-4.5 4 4 2.5-2.5L20 17M15 9h.01",
  tv: "M3 5h18v12H3zM8 21h8M12 17v4",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4a2 2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  back: "M15 18l-6-6 6-6",
  chevron: "M9 6l6 6-6 6",
  search: "m20 20-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  alert: "M12 9v4m0 4h.01M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  check: "M5 12.5 10 17.5 19.5 7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l3 2",
  signout: "M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2v2M18 18h2v2h-2",
  supplies: "M7 3h10l1 4H6l1-4Zm-1 4h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Zm4 5h4",
  sparkle: "M12 3v4m0 10v4M3 12h4m10 0h4M6.3 6.3l2.8 2.8m5.8 5.8 2.8 2.8m0-11.4-2.8 2.8m-5.8 5.8-2.8 2.8",
  drop: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z",
  wrench: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5a1.4 1.4 0 0 0 2 2l5.8-5.8a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.4Z",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9V16h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3Z",
  thermo: "M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z",
  dots: "M5 12h.01M12 12h.01M19 12h.01",
  clog: "M5 10h14l-1.5 7a2 2 0 0 1-2 1.6h-7a2 2 0 0 1-2-1.6L5 10Zm2-4h10M12 3v3",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
