"use server";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { sendTestPush } from "@/lib/notify";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function savePushSubscription(sub: Sub): Promise<boolean> {
  const user = await requireUser();
  if (!sub?.endpoint?.startsWith("https://") || !sub.keys?.p256dh || !sub.keys?.auth) return false;
  const data = { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
  await db.pushSubscription.upsert({ where: { endpoint: sub.endpoint }, create: { endpoint: sub.endpoint, ...data }, update: data });
  return (await sendTestPush(user.id)) > 0;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const user = await requireUser();
  await db.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
}
