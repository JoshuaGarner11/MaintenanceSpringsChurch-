"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { btn } from "@/components/ui";
import { uploadArt } from "./actions";

export function ArtUploader() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setBusy(true);
    const failed: string[] = [];
    for (const [i, f] of list.entries()) {
      setStatus(`Uploading ${i + 1} of ${list.length}…`);
      const form = new FormData();
      form.set("file", f);
      const res = await uploadArt(form).catch(() => ({ ok: false }));
      if (!res.ok) failed.push(f.name);
    }
    setBusy(false);
    setStatus(`Added ${list.length - failed.length} painting${list.length - failed.length === 1 ? "" : "s"}.${failed.length ? ` Couldn't add: ${failed.join(", ")}` : ""}`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className={`${btn} cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""}`}>
        Add paintings…
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </label>
      <p className="text-xs text-slate-500">Pick as many as you like. Name files &quot;Artist - Title.jpg&quot; and the board will label them.</p>
      {status && <p className="text-sm text-slate-700">{status}</p>}
    </div>
  );
}
