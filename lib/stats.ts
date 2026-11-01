// Counters behind the agent's Stats page. Server only.
// Per listing: viewCount, waTaps, callTaps, shareTaps, enquiryCount on the listing.
// Per day: agentDaily/{agentId}_{yyyy-mm-dd} (IST) with the same counts plus page views.
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { propertiesCol } from "@/lib/firestore";
import { istDayKey } from "@/lib/dates";
import type { AgentDailyDoc } from "@/types";

export const agentDailyCol = () => adminDb.collection("agentDaily");

export type StatEvent = "page" | "view" | "wa" | "call" | "share" | "enquiry";

const DAILY_FIELD: Record<StatEvent, keyof AgentDailyDoc> = {
  page: "pageViews", view: "listingViews", wa: "waTaps", call: "callTaps", share: "shareTaps", enquiry: "enquiries",
};
const LISTING_FIELD: Partial<Record<StatEvent, string>> = {
  view: "viewCount", wa: "waTaps", call: "callTaps", share: "shareTaps", enquiry: "enquiryCount",
};

export async function recordStat(agentId: string, event: StatEvent, propertyId?: string | null, now = new Date()) {
  const date = istDayKey(now);
  const batch = adminDb.batch();
  batch.set(
    agentDailyCol().doc(`${agentId}_${date}`),
    { agentId, date, [DAILY_FIELD[event]]: FieldValue.increment(1) },
    { merge: true }
  );
  const field = LISTING_FIELD[event];
  if (propertyId && field) batch.update(propertiesCol().doc(propertyId), { [field]: FieldValue.increment(1) });
  await batch.commit();
}

/** The agent's daily counters for the last `days` days (IST), oldest first, gaps filled with zeros. */
export async function getAgentDaily(agentId: string, days = 30, now = new Date()): Promise<AgentDailyDoc[]> {
  const from = istDayKey(new Date(now.getTime() - (days - 1) * 86400000));
  const snap = await agentDailyCol().where("agentId", "==", agentId).where("date", ">=", from).orderBy("date", "asc").get();
  const byDate = new Map(snap.docs.map((d) => [d.data().date as string, d.data() as AgentDailyDoc]));
  const out: AgentDailyDoc[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = istDayKey(new Date(now.getTime() - i * 86400000));
    const d = byDate.get(date);
    out.push({ agentId, date, pageViews: d?.pageViews || 0, listingViews: d?.listingViews || 0, waTaps: d?.waTaps || 0, callTaps: d?.callTaps || 0, shareTaps: d?.shareTaps || 0, enquiries: d?.enquiries || 0 });
  }
  return out;
}
