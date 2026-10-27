import { test } from "node:test";
import assert from "node:assert/strict";
import { addInterval, describeRepeat, isReadyToCreate } from "./recurrence";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);

test("adds days, weeks, months and years", () => {
  assert.equal(iso(addInterval(d("2026-04-15"), 10, "DAY")), "2026-04-25");
  assert.equal(iso(addInterval(d("2026-04-15"), 2, "WEEK")), "2026-04-29");
  assert.equal(iso(addInterval(d("2026-04-15"), 3, "MONTH")), "2026-07-15");
  assert.equal(iso(addInterval(d("2026-04-15"), 1, "YEAR")), "2027-04-15");
});

test("clamps to the end of shorter months", () => {
  assert.equal(iso(addInterval(d("2026-01-31"), 1, "MONTH")), "2026-02-28");
  assert.equal(iso(addInterval(d("2028-02-29"), 1, "YEAR")), "2029-02-28");
});

test("creates work orders lead days ahead", () => {
  assert.equal(isReadyToCreate(d("2026-05-01"), 14, d("2026-04-16")), false);
  assert.equal(isReadyToCreate(d("2026-05-01"), 14, d("2026-04-17")), true);
});

test("describes repeat rules", () => {
  assert.equal(describeRepeat(1, "YEAR"), "Yearly");
  assert.equal(describeRepeat(1, "DAY"), "Daily");
  assert.equal(describeRepeat(3, "MONTH"), "Every 3 months");
});
