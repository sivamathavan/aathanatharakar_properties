// Commission maths for the tracker. Pure functions, unit-tested in
// tests/commission.test.ts. Every screen and the server use these, so the
// numbers can't disagree with each other.

export type DealType =
  | "Both Side Broker"
  | "Buyer Side Only"
  | "Seller Side Only"
  | "Direct Deal"
  | "Chain Broker"
  | "Referral";

export interface DealTerms {
  deal_type: DealType | string;
  property_value: number;
  commission_rate_seller: number; // percent
  commission_rate_buyer: number; // percent
}

export interface LedgerEntry {
  id: string;
  direction: "IN" | "OUT"; // IN = commission received, OUT = paid to co-brokers/partners
  deal_id?: string | null;
  amount: number; // commission amount, excluding GST
  settled: boolean; // received / paid
}

export interface DealLike extends DealTerms {
  id: string;
  status: string;
}

export const GST_RATE = 0.18;
export const TDS_194H_RATE = 0.02; // Section 194H, from 1 Oct 2024

const round = (n: number) => Math.round(n);

/** Commission we earn on a deal, split by side. One-sided deals ignore the other side's rate. */
export function dealCommission(d: DealTerms) {
  const value = Math.max(0, Number(d.property_value) || 0);
  const sellerRate = Math.max(0, Number(d.commission_rate_seller) || 0);
  const buyerRate = Math.max(0, Number(d.commission_rate_buyer) || 0);
  const seller = d.deal_type === "Buyer Side Only" ? 0 : round((value * sellerRate) / 100);
  const buyer = d.deal_type === "Seller Side Only" ? 0 : round((value * buyerRate) / 100);
  return { seller, buyer, total: seller + buyer };
}

/**
 * What an invoice for `commission` looks like.
 * GST is charged on top (only when GST-registered) and passed on to the government.
 * TDS is deducted by the payer only when they are required to; it is income tax
 * paid in advance, claimable in your return, so it is shown separately.
 */
export function invoiceBreakdown(commission: number, opts: { gstRegistered: boolean; tdsDeducted: boolean }) {
  const base = round(Math.max(0, commission));
  const gst = opts.gstRegistered ? round(base * GST_RATE) : 0;
  const tds = opts.tdsDeducted ? round(base * TDS_194H_RATE) : 0;
  return {
    commission: base,
    gst,
    invoiceTotal: base + gst,
    tds,
    clientPays: base + gst - tds,
    gstToGovernment: gst,
    netInBank: base - tds, // after paying the GST over
  };
}

/** Totals across all deals and the ledger. Dropped deals expect nothing. */
export function commissionSummary(deals: DealLike[], ledger: LedgerEntry[]) {
  const live = deals.filter((d) => d.status !== "Dropped");
  const perDeal = new Map<string, { expected: number; received: number; paidOut: number }>();
  for (const d of live) perDeal.set(d.id, { expected: dealCommission(d).total, received: 0, paidOut: 0 });

  let received = 0;
  let receivable = 0; // logged as expected from someone but not in yet
  let paidOut = 0;
  let payable = 0;
  for (const e of ledger) {
    const amt = Math.max(0, Number(e.amount) || 0);
    const row = e.deal_id ? perDeal.get(e.deal_id) : undefined;
    if (e.direction === "IN") {
      if (e.settled) {
        received += amt;
        if (row) row.received += amt;
      } else receivable += amt;
    } else {
      if (e.settled) {
        paidOut += amt;
        if (row) row.paidOut += amt;
      } else payable += amt;
    }
  }

  let expected = 0;
  let outstanding = 0;
  perDeal.forEach((row) => {
    expected += row.expected;
    outstanding += Math.max(0, row.expected - row.received);
  });

  return {
    expected,
    received,
    outstanding,
    receivable,
    paidOut,
    payable,
    netInHand: received - paidOut,
    perDeal,
  };
}
