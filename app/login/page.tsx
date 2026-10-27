import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <img src="/icon.svg" alt="" className="mx-auto mb-3 h-14 w-14" />
        <h1 className="text-2xl font-semibold">Springs Maintenance</h1>
        <p className="text-sm text-slate-500">Sign in with the email Vlad added you with.</p>
      </div>
      <LoginForm />
    </main>
  );
}
