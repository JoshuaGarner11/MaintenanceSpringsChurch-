"use client";

import { useActionState } from "react";
import { btn, btnSecondary, Card, Field, input } from "@/components/ui";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { step: "email" });
  return (
    <Card className="p-5">
      <form action={action} className="space-y-4">
        {state.step === "email" ? (
          <Field label="Email">
            <input name="email" type="email" autoComplete="email" required autoFocus className={input} />
          </Field>
        ) : (
          <>
            <input type="hidden" name="email" value={state.email} />
            <p className="text-sm text-slate-600">
              If <strong>{state.email}</strong> has an account, we've emailed it a 6-digit code.
            </p>
            <Field label="Code">
              <input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                className={`${input} text-center font-mono text-2xl tracking-[0.5em]`}
              />
            </Field>
          </>
        )}
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}
        <button className={`${btn} w-full`} disabled={pending}>
          {state.step === "email" ? "Email me a code" : "Sign in"}
        </button>
      </form>
      {state.step === "code" && (
        <form action={action} className="mt-2">
          <input type="hidden" name="email" value={state.email} />
          <button className={`${btnSecondary} w-full`} disabled={pending}>Send a new code</button>
        </form>
      )}
    </Card>
  );
}
