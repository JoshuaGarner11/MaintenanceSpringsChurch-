"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Keeps the TV current: fresh data every minute, a full reload every few hours (picks up app updates).
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = setInterval(() => router.refresh(), seconds * 1000);
    const reload = setTimeout(() => location.reload(), 6 * 3600_000);
    return () => {
      clearInterval(tick);
      clearTimeout(reload);
    };
  }, [router, seconds]);
  return null;
}

export function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  return (
    <div className="text-right">
      <div className="text-[3.2vw] leading-none font-semibold tabular-nums">{now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
      <div className="mt-1 text-[1.2vw] text-slate-400">{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
    </div>
  );
}
