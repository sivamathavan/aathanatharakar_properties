import { adminDb } from "@/lib/firebase-admin";
import { docToTyped } from "@/lib/firestore";
import { dealCommission, type LedgerEntry } from "@/lib/crm/commission";
import { crmCollectionName, type CrmCollection } from "@/lib/crm/schemas";

export const crmCol = (c: CrmCollection) => adminDb.collection(crmCollectionName(c));

function serialize(row: any) {
  const out = { ...row };
  for (const k of ["created_at", "updated_at", "timestamp"]) if (out[k] instanceof Date) out[k] = out[k].toISOString();
  return out;
}

/** All live rows of a tracker collection, newest first. Admin data is small (hundreds of rows). */
export async function listCrm(c: CrmCollection, limit = 3000) {
  const snap = await crmCol(c).orderBy("created_at", "desc").limit(limit).get();
  return snap.docs.map((d) => docToTyped<any>(d)).filter((r) => r && !r.deleted_at).map(serialize);
}

/** Deals with commission worked out from their terms and money-in from the ledger. */
export async function listDealsWithMoney() {
  const [deals, ledger] = await Promise.all([listCrm("deals"), listCrm("ledger")]);
  const received = new Map<string, number>();
  for (const e of ledger as LedgerEntry[]) {
    if (e.direction === "IN" && e.settled && e.deal_id) received.set(e.deal_id, (received.get(e.deal_id) || 0) + Number(e.amount));
  }
  return deals.map((d: any) => ({ ...d, commission_amount: dealCommission(d).total, commission_received: received.get(d.id) || 0 }));
}
