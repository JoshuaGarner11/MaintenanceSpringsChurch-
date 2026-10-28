"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

// Uses the browser's built-in QR reader where there is one (Chrome on Android).
// On iPhone the normal Camera app reads the labels and opens the page directly.
export function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [state, setState] = useState<"starting" | "scanning" | "unsupported" | "denied">("starting");

  useEffect(() => {
    const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!BD || !navigator.mediaDevices) {
      setState("unsupported");
      return;
    }
    const detector = new BD({ formats: ["qr_code"] });
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then(async (s) => {
        stream = s;
        if (!video.current) return;
        video.current.srcObject = s;
        await video.current.play();
        setState("scanning");
        timer = setInterval(async () => {
          if (!video.current) return;
          const [hit] = await detector.detect(video.current).catch(() => []);
          if (!hit) return;
          try {
            const url = new URL(hit.rawValue, window.location.origin);
            if (/^\/(assets|locations)\//.test(url.pathname)) {
              clearInterval(timer);
              router.push(url.pathname);
            }
          } catch {}
        }, 300);
      })
      .catch(() => setState("denied"));
    return () => {
      clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  if (state === "unsupported")
    return <p className="text-sm text-slate-600">Open your phone's Camera app and point it at the QR label. It will open the record here.</p>;
  if (state === "denied") return <p className="text-sm text-slate-600">Camera access was blocked. Allow it in your browser settings, or use the Camera app instead.</p>;
  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <video ref={video} playsInline muted className="aspect-square w-full object-cover" />
    </div>
  );
}
