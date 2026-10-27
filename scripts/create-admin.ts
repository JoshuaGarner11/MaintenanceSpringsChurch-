// First-time setup: npm run create-admin -- "Vlad Lastname" vlad@springschurch.org
import { PrismaClient } from "@prisma/client";

const [name, email] = process.argv.slice(2);
if (!name || !email?.includes("@")) {
  console.error('Usage: npm run create-admin -- "Full Name" email@example.org');
  process.exit(1);
}
const db = new PrismaClient();
db.user
  .upsert({ where: { email: email.toLowerCase() }, update: { name, role: "ADMIN", active: true }, create: { name, email: email.toLowerCase(), role: "ADMIN" } })
  .then((u) => console.log(`Admin ready: ${u.name} <${u.email}>`))
  .finally(() => db.$disconnect());
