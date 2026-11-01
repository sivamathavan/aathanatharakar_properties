import { test } from "node:test";
import assert from "node:assert/strict";
import { followUpState, friendlyDay, istDayKey, istDayStart, istDaysFromToday } from "../../lib/dates";

test("IST day changes at 18:30 UTC", () => {
  assert.equal(istDayKey(new Date("2026-11-01T18:29:00Z")), "2026-11-01");
  assert.equal(istDayKey(new Date("2026-11-01T18:30:00Z")), "2026-11-02");
});

test("IST midnight in UTC", () => {
  assert.equal(istDayStart(new Date("2026-11-01T10:00:00Z")).toISOString(), "2026-10-31T18:30:00.000Z");
  assert.equal(istDayStart(new Date("2026-11-01T10:00:00Z"), 1).toISOString(), "2026-11-01T18:30:00.000Z");
});

test("days from today count IST calendar days, not 24-hour blocks", () => {
  const now = new Date("2026-11-01T17:00:00Z"); // 22:30 IST on 1 Nov
  assert.equal(istDaysFromToday(new Date("2026-11-01T19:00:00Z"), now), 1); // 00:30 IST on 2 Nov
  assert.equal(istDaysFromToday(new Date("2026-11-01T03:00:00Z"), now), 0);
  assert.equal(istDaysFromToday(new Date("2026-10-31T10:00:00Z"), now), -1);
});

test("follow-up state", () => {
  const now = new Date("2026-11-01T06:00:00Z");
  assert.equal(followUpState(null, now), null);
  assert.equal(followUpState(new Date("2026-10-30T04:30:00Z"), now), "overdue");
  assert.equal(followUpState(new Date("2026-11-01T12:00:00Z"), now), "today");
  assert.equal(followUpState(new Date("2026-11-03T04:30:00Z"), now), "later");
});

test("friendly day words", () => {
  const now = new Date("2026-11-01T06:00:00Z");
  assert.equal(friendlyDay(new Date("2026-11-01T10:00:00Z"), now), "Today");
  assert.equal(friendlyDay(new Date("2026-11-02T04:30:00Z"), now), "Tomorrow");
  assert.equal(friendlyDay(new Date("2026-11-02T04:30:00Z"), now, { today: "இன்று", tomorrow: "நாளை", yesterday: "நேற்று" }), "நாளை");
});
