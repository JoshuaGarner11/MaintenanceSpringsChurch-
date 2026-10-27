import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAnswer } from "./maintainx";

test("reads pass/fail answers with notes", () => {
  assert.deepEqual(parseAnswer("PASS,Notes: Johnson Control performed the test."), { kind: "PASS_FAIL", value: "PASS", note: "Johnson Control performed the test." });
  assert.deepEqual(parseAnswer("Fail"), { kind: "PASS_FAIL", value: "FAIL", note: null });
});

test("keeps anything else as text", () => {
  assert.deepEqual(parseAnswer("42 psi"), { kind: "TEXT", value: "42 psi", note: null });
  assert.deepEqual(parseAnswer("Passable"), { kind: "TEXT", value: "Passable", note: null });
  assert.deepEqual(parseAnswer("  "), { kind: "TEXT", value: null, note: null });
});
