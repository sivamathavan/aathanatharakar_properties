import { test } from "node:test";
import assert from "node:assert/strict";
import { daysLeft, effectiveStatus, extendExpiry, isPlanLive, mergePlans, slugify, trialPlan, waNumber } from "../../lib/plans";

const NOW = new Date("2026-10-31T10:00:00Z");

test("trial lasts the configured days", () => {
  const plan = trialPlan(14, NOW);
  assert.equal(daysLeft(plan, NOW), 14);
  assert.equal(isPlanLive(plan, NOW), true);
  assert.equal(isPlanLive(plan, new Date("2026-11-15T00:00:00Z")), false);
});

test("paying early stacks on the remaining time", () => {
  const current = new Date("2026-11-10T10:00:00Z");
  assert.equal(extendExpiry(current, "MONTHLY", NOW).toISOString(), "2026-12-10T10:00:00.000Z");
  assert.equal(extendExpiry(current, "YEARLY", NOW).toISOString(), "2027-11-10T10:00:00.000Z");
});

test("paying after expiry starts from today", () => {
  const expired = new Date("2026-09-01T00:00:00Z");
  assert.equal(extendExpiry(expired, "MONTHLY", NOW).toISOString(), "2026-11-30T10:00:00.000Z");
});

test("suspended plans are never live", () => {
  const plan = { id: "PRO" as const, status: "SUSPENDED" as const, expiresAt: new Date("2027-01-01") };
  assert.equal(isPlanLive(plan, NOW), false);
  assert.equal(effectiveStatus(plan, NOW), "SUSPENDED");
});

test("expired shows as EXPIRED whatever the stored status", () => {
  assert.equal(effectiveStatus({ id: "STARTER", status: "ACTIVE", expiresAt: new Date("2026-10-01") }, NOW), "EXPIRED");
});

test("admin price overrides merge onto defaults", () => {
  const merged = mergePlans({ trialDays: 7, plans: { STARTER: { priceMonthly: 349 } } as any });
  assert.equal(merged.trialDays, 7);
  assert.equal(merged.plans.STARTER.priceMonthly, 349);
  assert.equal(merged.plans.STARTER.listingLimit, 25);
  assert.equal(merged.plans.PRO.priceMonthly, 699);
});

test("slugs are safe for links", () => {
  assert.equal(slugify("Sri Murugan Real Estate & Co."), "sri-murugan-real-estate-co");
  assert.equal(slugify("  ராஜா Properties "), "properties");
});

test("WhatsApp numbers get the 91 prefix", () => {
  assert.equal(waNumber("98765 43210"), "919876543210");
  assert.equal(waNumber("+91 98765-43210"), "919876543210");
});

test("month-end and leap-day renewals don't skip a month", () => {
  assert.equal(extendExpiry(new Date("2027-01-31T00:00:00Z"), "MONTHLY", new Date("2027-01-01")).toISOString(), "2027-02-28T00:00:00.000Z");
  assert.equal(extendExpiry(new Date("2028-02-29T00:00:00Z"), "YEARLY", new Date("2028-01-01")).toISOString(), "2029-02-28T00:00:00.000Z");
});
