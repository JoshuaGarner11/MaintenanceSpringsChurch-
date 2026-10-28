import { test } from "node:test";
import assert from "node:assert/strict";
import ical from "node-ical";
import { eventsBetween } from "./calendar";

const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:weekly
DTSTART:20261026T150000Z
DTEND:20261026T160000Z
RRULE:FREQ=WEEKLY;COUNT=10
EXDATE:20261102T150000Z
SUMMARY:Staff meeting
END:VEVENT
BEGIN:VEVENT
UID:once
DTSTART;VALUE=DATE:20261029
DTEND;VALUE=DATE:20261030
SUMMARY:Fire marshal visit
LOCATION:Main building
END:VEVENT
BEGIN:VEVENT
UID:gone
DTSTART:20261029T150000Z
DTEND:20261029T160000Z
STATUS:CANCELLED
SUMMARY:Cancelled thing
END:VEVENT
END:VCALENDAR`;

test("expands repeats, skips exceptions and cancelled events", () => {
  const cal = ical.sync.parseICS(ics);
  const events = eventsBetween(cal, new Date("2026-10-28T00:00:00Z"), new Date("2026-11-12T00:00:00Z"));
  const titles = events.map((e) => `${e.title}@${e.allDay ? "day" : e.start.toISOString().slice(0, 10)}`);
  assert.deepEqual(titles, ["Fire marshal visit@day", "Staff meeting@2026-11-09"]);
  assert.equal(events[0].location, "Main building");
});
