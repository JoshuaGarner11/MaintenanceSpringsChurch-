"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { str } from "@/lib/format";

const ROLES: Role[] = ["ADMIN", "TECHNICIAN", "VIEWER"];
const role = (v: FormDataEntryValue | null) => (ROLES.includes(String(v) as Role) ? (String(v) as Role) : "TECHNICIAN");

export async function inviteUser(form: FormData) {
  const admin = await requireUser("ADMIN");
  const email = str(form.get("email"))?.toLowerCase();
  const name = str(form.get("name"));
  if (!email || !name) return;
  await db.user.upsert({ where: { email }, update: { name, role: role(form.get("role")), active: true }, create: { email, name, role: role(form.get("role")) } });
  const url = process.env.APP_URL ?? "";
  await sendMail(
    email,
    "You've been added to Springs Maintenance",
    `Hi ${name},\n\n${admin.name} added you to Springs Maintenance.\n\nOpen ${url || "the app"} on your phone, enter this email address, and we'll send you a sign-in code. Tip: add it to your home screen so it works like an app.`,
  );
  revalidatePath("/users");
}

export async function updateUser(id: string, form: FormData) {
  const admin = await requireUser("ADMIN");
  // An admin can't lock themselves out by demoting or deactivating their own account.
  const self = id === admin.id;
  await db.user.update({
    where: { id },
    data: {
      name: str(form.get("name")) ?? undefined,
      email: str(form.get("email"))?.toLowerCase() ?? undefined,
      role: self ? "ADMIN" : role(form.get("role")),
      active: self ? true : form.get("active") === "on",
    },
  });
  if (!self && form.get("active") !== "on") await db.session.deleteMany({ where: { userId: id } });
  revalidatePath("/users");
}
