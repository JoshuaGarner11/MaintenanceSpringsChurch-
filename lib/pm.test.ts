import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDueWorkOrders } from "./pm";

// A tiny in-memory stand-in for the parts of Prisma the generator uses.
function fakeDb(schedules: any[]) {
  const orders: any[] = [];
  const db: any = {
    pmSchedule: {
      findMany: async () => schedules,
      update: async ({ where, data }: any) => Object.assign(schedules.find((s) => s.id === where.id), data),
    },
    workOrder: {
      create: async ({ data }: any) => {
        const o = { ...data, number: orders.length + 1 };
        orders.push(o);
        return o;
      },
    },
    $transaction: async (fn: any) => fn(db),
  };
  return { db, orders };
}

const base = {
  id: "s1", title: "Annual sprinkler test", description: null, priority: "HIGH", categories: [],
  every: 1, unit: "YEAR", leadDays: 14, active: true, assetId: null, locationId: null,
  vendorId: null, assigneeId: "u1", checklistId: null, checklist: null,
};
const d = (s: string) => new Date(`${s}T12:00:00Z`);

test("creates nothing before the lead window", async () => {
  const { db, orders } = fakeDb([{ ...base, nextDue: d("2027-04-15") }]);
  assert.deepEqual(await generateDueWorkOrders(db, d("2027-03-01")), []);
  assert.equal(orders.length, 0);
});

test("creates one order inside the lead window and advances the schedule", async () => {
  const s = { ...base, nextDue: d("2027-04-15") };
  const { db, orders } = fakeDb([s]);
  await generateDueWorkOrders(db, d("2027-04-05"));
  assert.equal(orders.length, 1);
  assert.equal(orders[0].type, "PREVENTIVE");
  assert.equal(orders[0].dueDate.toISOString().slice(0, 10), "2027-04-15");
  assert.equal(s.nextDue.toISOString().slice(0, 10), "2028-04-15");
  await generateDueWorkOrders(db, d("2027-04-06"));
  assert.equal(orders.length, 1, "running again the next day doesn't duplicate");
});

test("after missed periods, creates only the latest", async () => {
  const s = { ...base, unit: "MONTH", nextDue: d("2026-01-10") };
  const { db, orders } = fakeDb([s]);
  await generateDueWorkOrders(db, d("2026-06-01"));
  assert.equal(orders.length, 1);
  assert.equal(orders[0].dueDate.toISOString().slice(0, 10), "2026-06-10");
  assert.equal(s.nextDue.toISOString().slice(0, 10), "2026-07-10");
});
