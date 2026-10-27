"use server";

import { redirect } from "next/navigation";
import { sendLoginCode, signOut, verifyLoginCode } from "@/lib/auth";

export type LoginState = { step: "email" | "code"; email?: string; error?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const code = String(form.get("code") ?? "").trim();
  if (!email.includes("@")) return { step: "email", error: "Enter your email address." };
  if (!code) {
    await sendLoginCode(email);
    return { step: "code", email };
  }
  if (!(await verifyLoginCode(email, code))) {
    return { step: "code", email, error: "That code didn't work. Check it, or request a new one." };
  }
  redirect("/");
}

export async function signOutAction() {
  await signOut();
  redirect("/login");
}
