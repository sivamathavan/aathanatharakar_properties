// Turning a checked UPI payment into plan time or a boost. Server-only.
import { adminDb } from "@/lib/firebase-admin";
import { agentsCol, getPlansConfig, paymentRequestsCol, propertiesCol, writeAudit } from "@/lib/firestore";
import { extendExpiry, planPrice } from "@/lib/plans";
import type { BillingPeriod, PlanId } from "@/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function toDate(v: any): Date | null {
  if (!v) return null;
  return v.toDate ? v.toDate() : new Date(v);
}

export class BillingError extends Error {}

/** Approve or reject a pending payment. Approving extends the plan or starts the boost, atomically. */
export async function decidePaymentRequest(requestId: string, adminUid: string, decision: "APPROVE" | "REJECT", note?: string | null) {
  const result = await adminDb.runTransaction(async (tx) => {
    const reqRef = paymentRequestsCol().doc(requestId);
    const reqSnap = await tx.get(reqRef);
    if (!reqSnap.exists) throw new BillingError("Payment not found.");
    const req = reqSnap.data()!;
    if (req.status !== "PENDING") throw new BillingError("This payment was already decided.");

    const agentRef = agentsCol().doc(req.agentId);
    const agentSnap = await tx.get(agentRef);
    if (!agentSnap.exists) throw new BillingError("Agent not found.");
    const agent = agentSnap.data()!;
    const now = new Date();

    if (decision === "REJECT") {
      tx.update(reqRef, { status: "REJECTED", decidedBy: adminUid, decidedAt: now, note: note || null });
      return { agent, req, summary: "rejected" };
    }

    if (req.kind === "PLAN") {
      const expiresAt = extendExpiry(toDate(agent.plan?.expiresAt), req.period as BillingPeriod, now);
      tx.update(agentRef, { plan: { id: req.planId, status: "ACTIVE", expiresAt, period: req.period }, firstPaidAt: agent.firstPaidAt || now, lastReminderKey: null, updatedAt: now });
      tx.update(reqRef, { status: "APPROVED", decidedBy: adminUid, decidedAt: now, note: note || null });
      return { agent, req, summary: `${req.planId} until ${expiresAt.toDateString()}` };
    }

    const propRef = propertiesCol().doc(req.propertyId);
    const propSnap = await tx.get(propRef);
    if (!propSnap.exists) throw new BillingError("The boosted listing no longer exists.");
    const current = toDate(propSnap.data()!.boostUntil);
    const start = current && current > now ? current : now;
    const boostUntil = new Date(start.getTime() + Number(req.weeks) * WEEK_MS);
    tx.update(propRef, { onMarketplace: true, boostUntil, updatedAt: now });
    tx.update(reqRef, { status: "APPROVED", decidedBy: adminUid, decidedAt: now, note: note || null });
    return { agent, req, summary: `boost until ${boostUntil.toDateString()}` };
  });

  await writeAudit(adminUid, `payment.${decision.toLowerCase()}`, requestId, { agentId: result.req.agentId, amount: result.req.amount, summary: result.summary });
  return result;
}

/** Cash or bank payment the admin received directly: record it and extend the plan. */
export async function recordManualPlanPayment(agentId: string, adminUid: string, planId: Exclude<PlanId, "TRIAL">, period: BillingPeriod, reference: string) {
  const plans = await getPlansConfig();
  const ref = paymentRequestsCol().doc();
  await adminDb.runTransaction(async (tx) => {
    const agentRef = agentsCol().doc(agentId);
    const snap = await tx.get(agentRef);
    if (!snap.exists) throw new BillingError("Agent not found.");
    const agent = snap.data()!;
    const now = new Date();
    const expiresAt = extendExpiry(toDate(agent.plan?.expiresAt), period, now);
    tx.update(agentRef, { plan: { id: planId, status: "ACTIVE", expiresAt, period }, firstPaidAt: agent.firstPaidAt || now, lastReminderKey: null, updatedAt: now });
    tx.set(ref, {
      agentId,
      agentName: agent.displayName,
      kind: "PLAN",
      planId,
      period,
      propertyId: null,
      propertyTitle: null,
      weeks: null,
      amount: planPrice(plans.plans[planId], period),
      utr: `MANUAL-${reference || now.getTime()}`.toUpperCase().slice(0, 40),
      status: "APPROVED",
      decidedBy: adminUid,
      decidedAt: now,
      note: "Recorded by admin",
      createdAt: now,
    });
  });
  await writeAudit(adminUid, "payment.manual", ref.id, { agentId, planId, period });
}

/** Suspend or restore an agent. Suspended pages go dark at once. */
export async function setAgentSuspended(agentId: string, adminUid: string, suspended: boolean) {
  await adminDb.runTransaction(async (tx) => {
    const agentRef = agentsCol().doc(agentId);
    const snap = await tx.get(agentRef);
    if (!snap.exists) throw new BillingError("Agent not found.");
    const plan = snap.data()!.plan;
    const restored = plan.previousStatus || (plan.id === "TRIAL" ? "TRIAL" : "ACTIVE");
    tx.update(agentRef, {
      plan: suspended ? { ...plan, status: "SUSPENDED", previousStatus: plan.status } : { ...plan, status: restored, previousStatus: null },
      updatedAt: new Date(),
    });
  });
  await writeAudit(adminUid, suspended ? "agent.suspend" : "agent.restore", agentId);
}
