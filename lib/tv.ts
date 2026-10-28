import { timingSafeEqual } from "node:crypto";

// The office TV opens /tv?key=TV_KEY so nobody has to sign in on it.
export function tvKeyOk(given: string | undefined): boolean {
  const key = process.env.TV_KEY;
  if (!key || key.length < 16 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function tvUrl(): string | null {
  const key = process.env.TV_KEY;
  if (!key || key.length < 16) return null;
  return new URL(`/tv?key=${encodeURIComponent(key)}`, process.env.APP_URL ?? "http://localhost:3000").toString();
}
