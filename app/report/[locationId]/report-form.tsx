"use client";

import { useActionState } from "react";
import { Icon } from "@/components/icon";
import { btn, Field, input } from "@/components/ui";
import { ISSUES } from "@/lib/report";
import { submitReport, type ReportState } from "./actions";

export function ReportForm({ locationId }: { locationId: string }) {
  const [state, action, pending] = useActionState<ReportState, FormData>(submitReport.bind(null, locationId), {});

  if (state.ok)
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-600 text-white shadow-float"><Icon name="check" className="h-7 w-7" /></div>
        <p className="mt-2 text-lg font-semibold text-emerald-900">Thank you!</p>
        <p className="text-sm text-emerald-800">The building team has been told and will take care of it.</p>
        <a href="" className="mt-4 inline-block text-sm text-emerald-900 underline">Report something else</a>
      </div>
    );

  return (
    <form action={action} className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-[15px] font-semibold">What's wrong?</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {ISSUES.map((i) => (
            <label
              key={i.id}
              className="flex min-h-[92px] cursor-pointer flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-surface p-3.5 shadow-soft transition has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:ring-4 has-checked:ring-brand-500/15 active:scale-[0.98]"
            >
              <input type="radio" name="issue" value={i.id} required className="sr-only" />
              <Icon name={i.icon} className="h-6 w-6 text-brand-600" />
              <span className="text-[15px] leading-snug font-medium">{i.label}</span>
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
      <details className="rounded-2xl border border-slate-200 bg-surface px-4 py-3 shadow-soft">
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
      <button disabled={pending} className={`${btn} h-13 w-full text-base`}>{pending ? "Sending…" : "Send report"}</button>
    </form>
  );
}
