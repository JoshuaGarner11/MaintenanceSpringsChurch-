import { test } from "node:test";
import assert from "node:assert/strict";
import { pickForHour, titleFromFileName } from "./art";

test("reads artist and title from file names", () => {
  assert.deepEqual(titleFromFileName("Albert Bierstadt - Among the Sierra Nevada, California.jpg"), {
    artist: "Albert Bierstadt",
    title: "Among the Sierra Nevada, California",
  });
  assert.deepEqual(titleFromFileName("folder/Looking_Down_Yosemite_Valley.jpeg"), { artist: null, title: "Looking Down Yosemite Valley" });
});

test("changes painting each hour", () => {
  const items = ["a", "b", "c"];
  const t = Date.UTC(2026, 9, 28, 10);
  assert.notEqual(pickForHour(items, new Date(t)), pickForHour(items, new Date(t + 3600_000)));
  assert.equal(pickForHour(items, new Date(t)), pickForHour(items, new Date(t + 59 * 60_000)));
  assert.equal(pickForHour([], new Date(t)), null);
});
