import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/icon.svg" alt="" className="mx-auto mb-5 h-14 w-14 rounded-2xl shadow-float" />
          <h1 className="text-[28px] font-semibold tracking-tight">Springs Maintenance</h1>
          <p className="mt-1 text-[15px] text-slate-500">Sign in with the email Vlad added you with.</p>
        </div>
        <LoginForm />
        <p className="mt-8 text-center text-xs text-slate-400">The Springs Church · Building team</p>
      </div>
    </main>
  );
}
