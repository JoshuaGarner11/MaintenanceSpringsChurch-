import webpush from "web-push";
import { db } from "./db";
import { sendMail } from "./mail";

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY ?? "";

let configured = false;
function pushReady(): boolean {
  if (configured) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:maintenance@example.org", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

type Alert = { title: string; body: string; path: string };

// Sends a push to each of the user's devices. Returns how many got it.
async function pushToUser(userId: string, alert: Alert): Promise<number> {
  if (!pushReady()) return 0;
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  let delivered = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(alert),
        { TTL: 24 * 3600, urgency: "high" },
      );
      delivered++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // 404/410 mean the phone unsubscribed or the app was removed.
      if (status === 404 || status === 410) await db.pushSubscription.delete({ where: { id: s.id } });
      else console.error("[push]", status, e);
    }
  }
  return delivered;
}

// Alerts every active admin: push to their phones, or email if no phone is set up.
export async function alertAdmins(alert: Alert): Promise<void> {
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true } });
  const url = new URL(alert.path, process.env.APP_URL ?? "http://localhost:3000").toString();
  for (const a of admins) {
    try {
      if ((await pushToUser(a.id, alert)) > 0) continue;
      await sendMail(a.email, alert.title, `${alert.body}\n\n${url}`);
    } catch (e) {
      console.error("[alert]", a.email, e);
    }
  }
}

export async function sendTestPush(userId: string): Promise<number> {
  return pushToUser(userId, { title: "Notifications are on", body: "You'll get an alert here when someone reports a problem.", path: "/" });
}
