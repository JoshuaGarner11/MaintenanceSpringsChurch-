"use client";

import { useActionState } from "react";
import { btn, Field, input } from "@/components/ui";
import { ISSUES } from "@/lib/report";
import { submitReport, type ReportState } from "./actions";

export function ReportForm({ locationId }: { locationId: string }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(submitReport.bind(null, locationId), {});

  if (state.ok)
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-4xl">✓</div>
        <p className="mt-2 text-lg font-semibold text-emerald-900">Thank you!</p>
        <p className="text-sm text-emerald-800">The building team has been told and will take care of it.</p>
        <a href="" className="mt-4 inline-block text-sm text-emerald-900 underline">Report something else</a>
      </div>
    );

  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">What's wrong?</legend>
        <div className="grid gap-2">
          {ISSUES.map((i) => (
            <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 has-checked:border-brand-600 has-checked:bg-brand-50">
              <input type="radio" name="issue" value={i.id} required className="h-5 w-5 accent-brand-600" />
              <span>{i.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Details (optional)">
        <textarea name="note" rows={3} maxLength={2000} className={input} placeholder="e.g. Second stall, paper towel dispenser is empty" />
      </Field>
      <Field label="Photo (optional)">
        <input type="file" name="photo" accept="image/*" capture="environment" className="block w-full text-sm" />
      </Field>
      <details className="rounded-xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm text-slate-600">Want to hear back? Add your name (optional)</summary>
        <div className="mt-3 space-y-3">
          <Field label="Name"><input name="name" maxLength={100} className={input} autoComplete="name" /></Field>
          <Field label="Phone or email"><input name="contact" maxLength={200} className={input} autoComplete="email" /></Field>
        </div>
      </details>
      <div aria-hidden className="absolute -left-[9999px]">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>}
      <button disabled={pending} className={`${btn} w-full py-3 text-base`}>{pending ? "Sending…" : "Send report"}</button>
    </form>
  );
}
