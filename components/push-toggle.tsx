"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription } from "@/app/(app)/more/actions";
import { btn, btnSecondary } from "./ui";

type State = "loading" | "unsupported" | "ios-install" | "blocked" | "off" | "on" | "error";

function keyBytes(base64url: string) {
  const b64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    (async () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState(ios && !standalone ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("error"));
  }, []);

  async function turnOn() {
    setState("loading");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("blocked");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      await savePushSubscription(sub.toJSON() as Parameters<typeof savePushSubscription>[0]);
      setState("on");
    } catch {
      setState("error");
    }
  }

  async function turnOff() {
    setState("loading");
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (sub) {
      await removePushSubscription(sub.endpoint);
      await sub.unsubscribe();
    }
    setState("off");
  }

  if (!publicKey) return <p className="text-sm text-slate-500">Push alerts aren't set up on the server yet (VAPID keys missing). You'll get emails instead.</p>;
  const text: Partial<Record<State, string>> = {
    loading: "Checking…",
    unsupported: "This browser can't show push alerts. You'll get emails instead.",
    "ios-install": "On iPhone, tap Share → Add to Home Screen, open the app from there, then come back here to turn alerts on.",
    blocked: "Alerts are blocked for this site. Allow notifications in your phone's settings, then reload.",
    on: "Alerts are on for this device.",
    off: "Get an alert on this phone when someone reports a problem.",
    error: "Something went wrong turning alerts on. Try again.",
  };
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{text[state]}</p>
      {(state === "off" || state === "error") && <button onClick={turnOn} className={btn}>Turn on alerts</button>}
      {state === "on" && <button onClick={turnOff} className={btnSecondary}>Turn off on this device</button>}
    </div>
  );
}
