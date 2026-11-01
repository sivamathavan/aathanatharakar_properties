import { test } from "node:test";
import assert from "node:assert/strict";
import { funnelOf, istWeekStart, monthlyRecurring, revenueByMonth, weeklyCohorts } from "../../lib/analytics";
import { DEFAULT_PLANS } from "../../lib/plans";

const NOW = new Date("2026-11-01T06:00:00Z");
const future = new Date("2026-12-01T00:00:00Z");
const agent = (id: string, over: Record<string, unknown> = {}) =>
  ({ id, createdAt: new Date("2026-10-28T06:00:00Z"), emailVerified: true, firstListingAt: null, firstSharedAt: null, firstPaidAt: null, plan: { id: "TRIAL", status: "TRIAL", expiresAt: future }, ...over }) as any;

test("funnel counts each step only after the earlier ones", () => {
  const agents = [
    agent("a", { emailVerified: false }),
    agent("b"),
    agent("c", { firstListingAt: NOW }),
    agent("d", { firstListingAt: NOW, firstSharedAt: NOW }),
    agent("e", { firstListingAt: NOW, firstSharedAt: NOW, firstPaidAt: NOW }),
    agent("f", { firstSharedAt: NOW, firstPaidAt: NOW }), // paid but never listed: stops at "verified"
  ];
  assert.deepEqual(funnelOf(agents, new Set(), new Set()), { signedUp: 6, verified: 5, listed: 3, shared: 2, paid: 1 });
  // A listing found in the database counts even without the milestone date.
  assert.equal(funnelOf([agent("g", { firstSharedAt: NOW })], new Set(["g"]), new Set(["g"])).paid, 1);
});

test("weeks start on Monday, India time", () => {
  // Sunday 1 Nov 2026, 11:30 IST → week of Monday 26 Oct
  assert.equal(istWeekStart(NOW).toISOString(), "2026-10-25T18:30:00.000Z");
  const cohorts = weeklyCohorts([agent("a"), agent("b", { createdAt: new Date("2026-10-20T06:00:00Z") })], new Set(), new Set(), 3, NOW);
  assert.deepEqual(cohorts.map((c) => c.signedUp), [1, 1, 0]);
});

test("monthly revenue counts live paid plans; yearly is a twelfth", () => {
  const agents = [
    agent("m", { plan: { id: "STARTER", status: "ACTIVE", expiresAt: future, period: "MONTHLY" } }),
    agent("y", { plan: { id: "PRO", status: "ACTIVE", expiresAt: future, period: "YEARLY" } }),
    agent("x", { plan: { id: "PRO", status: "ACTIVE", expiresAt: new Date("2026-10-01"), period: "MONTHLY" } }),
    agent("t"),
  ];
  assert.equal(Math.round(monthlyRecurring(agents, DEFAULT_PLANS, NOW)), Math.round(299 + 6999 / 12));
});

test("payments are grouped by IST month", () => {
  const rows = revenueByMonth(
    [
      { status: "APPROVED", amount: 299, kind: "PLAN", decidedAt: new Date("2026-10-31T19:00:00Z") }, // 1 Nov IST
      { status: "APPROVED", amount: 149, kind: "BOOST", decidedAt: new Date("2026-10-15T06:00:00Z") },
      { status: "REJECTED", amount: 999, kind: "PLAN", decidedAt: new Date("2026-10-15T06:00:00Z") },
    ],
    2,
    NOW
  );
  assert.deepEqual(rows, [
    { month: "2026-11", plans: 299, boosts: 0 },
    { month: "2026-10", plans: 0, boosts: 149 },
  ]);
});
