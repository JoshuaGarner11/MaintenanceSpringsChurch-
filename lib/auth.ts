import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "./db";
import { sendMail } from "./mail";

const SESSION_COOKIE = "sid";
const SESSION_DAYS = 60;
const CODE_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export async function sendLoginCode(email: string): Promise<void> {
  const user = await db.user.findFirst({ where: { email: email.trim().toLowerCase(), active: true } });
  // Same response whether or not the address exists, so the form can't be used to list users.
  if (!user) return;
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.loginCode.create({
    data: { userId: user.id, codeHash: hash(code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000) },
  });
  await sendMail(
    user.email,
    `Your sign-in code: ${code}`,
    `Hi ${user.name},\n\nYour Springs Maintenance sign-in code is ${code}. It expires in ${CODE_MINUTES} minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
  );
}

export async function verifyLoginCode(email: string, code: string): Promise<boolean> {
  const user = await db.user.findFirst({ where: { email: email.trim().toLowerCase(), active: true } });
  if (!user) return false;
  const pending = await db.loginCode.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "desc" },
  });
  if (!pending) return false;
  const given = Buffer.from(hash(code.trim()));
  const expected = Buffer.from(pending.codeHash);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    await db.loginCode.update({ where: { id: pending.id }, data: { attempts: { increment: 1 } } });
    return false;
  }
  await db.loginCode.update({ where: { id: pending.id }, data: { usedAt: new Date() } });
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { id: hash(token), userId: user.id, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: hash(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
}

export async function requireUser(...roles: Role[]): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) redirect("/");
  return user;
}

export const canEdit = (user: User) => user.role === "ADMIN" || user.role === "TECHNICIAN";

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hash(token) } });
  jar.delete(SESSION_COOKIE);
}
