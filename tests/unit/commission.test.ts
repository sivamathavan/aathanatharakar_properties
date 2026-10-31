import { test } from "node:test";
import assert from "node:assert/strict";
import { commissionSummary, dealCommission, invoiceBreakdown } from "../../lib/crm/commission";

const deal = (over: Partial<Parameters<typeof dealCommission>[0]> & { id?: string; status?: string } = {}) => ({
  id: "d1",
  status: "Negotiation",
  deal_type: "Both Side Broker",
  property_value: 4_500_000,
  commission_rate_seller: 1.5,
  commission_rate_buyer: 1,
  ...over,
});

test("both-side deal earns from both sides", () => {
  assert.deepEqual(dealCommission(deal()), { seller: 67_500, buyer: 45_000, total: 112_500 });
});

test("one-sided deals ignore the other side's rate", () => {
  assert.equal(dealCommission(deal({ deal_type: "Buyer Side Only" })).total, 45_000);
  assert.equal(dealCommission(deal({ deal_type: "Seller Side Only" })).total, 67_500);
});

test("chain and referral deals use whatever rates were agreed", () => {
  assert.equal(dealCommission(deal({ deal_type: "Chain Broker", commission_rate_buyer: 0 })).total, 67_500);
  assert.equal(dealCommission(deal({ deal_type: "Referral", commission_rate_seller: 0.5, commission_rate_buyer: 0 })).total, 22_500);
});

test("bad input never produces negative commission", () => {
  assert.equal(dealCommission(deal({ property_value: -5, commission_rate_seller: -1 })).total, 0);
  assert.equal(dealCommission(deal({ property_value: NaN as any })).total, 0);
});

test("GST is added on top, not taken out of the commission", () => {
  const inv = invoiceBreakdown(100_000, { gstRegistered: true, tdsDeducted: false });
  assert.equal(inv.gst, 18_000);
  assert.equal(inv.invoiceTotal, 118_000);
  assert.equal(inv.clientPays, 118_000);
  assert.equal(inv.netInBank, 100_000);
});

test("TDS under 194H is 2% and only when the client deducts it", () => {
  const withTds = invoiceBreakdown(100_000, { gstRegistered: true, tdsDeducted: true });
  assert.equal(withTds.tds, 2_000);
  assert.equal(withTds.clientPays, 116_000);
  assert.equal(withTds.netInBank, 98_000);
  assert.equal(invoiceBreakdown(100_000, { gstRegistered: false, tdsDeducted: false }).netInBank, 100_000);
});

test("summary counts each deal's commission once and cash from the ledger", () => {
  const deals = [
    deal({ id: "a" }), // 112,500 expected
    deal({ id: "b", deal_type: "Buyer Side Only", property_value: 7_200_000, commission_rate_buyer: 2, status: "Completed" }), // 144,000
    deal({ id: "c", status: "Dropped" }), // ignored
  ];
  const ledger = [
    { id: "1", direction: "IN" as const, deal_id: "b", amount: 144_000, settled: true },
    { id: "2", direction: "IN" as const, deal_id: "a", amount: 50_000, settled: true },
    { id: "3", direction: "IN" as const, deal_id: "a", amount: 10_000, settled: false },
    { id: "4", direction: "OUT" as const, deal_id: "a", amount: 20_000, settled: true },
    { id: "5", direction: "OUT" as const, deal_id: "b", amount: 5_000, settled: false },
  ];
  const s = commissionSummary(deals, ledger);
  assert.equal(s.expected, 256_500);
  assert.equal(s.received, 194_000);
  assert.equal(s.outstanding, 62_500);
  assert.equal(s.receivable, 10_000);
  assert.equal(s.paidOut, 20_000);
  assert.equal(s.payable, 5_000);
  assert.equal(s.netInHand, 174_000);
  assert.equal(s.perDeal.get("a")!.received, 50_000);
  assert.equal(s.perDeal.has("c"), false);
});

test("over-payment on a deal doesn't make outstanding negative", () => {
  const s = commissionSummary([deal({ id: "a" })], [{ id: "1", direction: "IN", deal_id: "a", amount: 200_000, settled: true }]);
  assert.equal(s.outstanding, 0);
});
