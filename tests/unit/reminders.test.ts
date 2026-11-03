import { test } from "node:test";
import assert from "node:assert/strict";
import { planReminderDue, renewalWhatsappText } from "../../lib/reminder-text";
import { trialPhoneKey } from "../../lib/trial";

const expires = new Date("2026-11-15T10:00:00Z");
const plan = { id: "STARTER" as const, status: "ACTIVE" as const, expiresAt: expires };
const at = (iso: string) => new Date(iso);

test("plan reminders go 7, 3, 1 and 0 days before, the day after, and the day before the page pauses", () => {
  assert.deepEqual(planReminderDue(plan, null, at("2026-11-08T03:00:00Z")), { key: "2026-11-15:7", daysLeft: 7 });
  assert.equal(planReminderDue(plan, null, at("2026-11-09T03:00:00Z")), null);
  assert.equal(planReminderDue(plan, null, at("2026-11-12T03:00:00Z"))?.daysLeft, 3);
  assert.equal(planReminderDue(plan, null, at("2026-11-14T03:00:00Z"))?.daysLeft, 1);
  assert.equal(planReminderDue(plan, null, at("2026-11-15T03:00:00Z"))?.daysLeft, 0);
  assert.equal(planReminderDue(plan, null, at("2026-11-16T03:00:00Z"))?.daysLeft, -1);
  assert.equal(planReminderDue(plan, null, at("2026-11-18T03:00:00Z")), null);
  assert.equal(planReminderDue(plan, null, at("2026-11-21T03:00:00Z"))?.daysLeft, -6);
  assert.equal(planReminderDue(plan, null, at("2026-11-23T03:00:00Z")), null);
});

test("each reminder is sent once", () => {
  assert.equal(planReminderDue(plan, "2026-11-15:3", at("2026-11-12T03:00:00Z")), null);
  // Renewing moves the expiry, so the next round has new keys.
  assert.ok(planReminderDue({ ...plan, expiresAt: new Date("2026-12-15T10:00:00Z") }, "2026-11-15:3", at("2026-12-12T03:00:00Z")));
});

test("suspended agents get no reminders", () => {
  assert.equal(planReminderDue({ ...plan, status: "SUSPENDED" }, null, at("2026-11-12T03:00:00Z")), null);
});

test("WhatsApp renewal text names the price and the days", () => {
  const text = renewalWhatsappText("Meena", expires, 299, at("2026-11-12T03:00:00Z"));
  assert.match(text, /Hi Meena/);
  assert.match(text, /ends in 3 days/);
  assert.match(text, /₹299/);
  assert.match(text, /\/dashboard\/billing/);
});

test("the trial record never stores the phone number itself", () => {
  const key = trialPhoneKey("9876501234");
  assert.equal(key, trialPhoneKey("9876501234"));
  assert.notEqual(key, trialPhoneKey("9876501235"));
  assert.ok(!key.includes("9876501234"));
  assert.match(key, /^h_[0-9a-f]{64}$/);
});
