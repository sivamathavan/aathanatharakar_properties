// "Send us a message" from the help panel: stored for the admin's Support inbox.
// Server only (firebase-admin). Browsers never read this collection directly.
import { adminDb } from "@/lib/firebase-admin";
import { docToTyped } from "@/lib/firestore";

export const supportMessagesCol = () => adminDb.collection("supportMessages");

export type SupportStatus = "NEW" | "DONE";

export interface SupportMessageDoc {
  id: string;
  message: string;
  name: string;
  phone: string;
  email: string | null;
  /** Set when a signed-in agent sent it; the name, phone and email then come from their account. */
  agentId: string | null;
  agentSlug: string | null;
  /** The agent's plan state when they wrote (TRIAL, ACTIVE, GRACE, EXPIRED, SUSPENDED). */
  planStatus: string | null;
  /** Page the message was sent from (path only, no query). */
  page: string;
  /** Help answer they were reading, if any. */
  topic: string | null;
  status: SupportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type NewSupportMessage = Omit<SupportMessageDoc, "id" | "status" | "createdAt" | "updatedAt">;

export async function createSupportMessage(data: NewSupportMessage): Promise<string> {
  const now = new Date();
  const ref = await supportMessagesCol().add({ ...data, status: "NEW", createdAt: now, updatedAt: now });
  return ref.id;
}

export async function listSupportMessages(limit = 200): Promise<SupportMessageDoc[]> {
  const snap = await supportMessagesCol().orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => docToTyped<SupportMessageDoc>(d)!);
}

export async function countNewSupportMessages(): Promise<number> {
  try {
    const agg = await supportMessagesCol().where("status", "==", "NEW").count().get();
    return agg.data().count;
  } catch (err) {
    console.error("[SUPPORT_COUNT]", err);
    return 0;
  }
}

export async function getSupportMessage(id: string): Promise<SupportMessageDoc | null> {
  return docToTyped<SupportMessageDoc>(await supportMessagesCol().doc(id).get());
}

export async function setSupportStatus(id: string, status: SupportStatus) {
  await supportMessagesCol().doc(id).update({ status, updatedAt: new Date() });
}

export async function deleteSupportMessage(id: string) {
  await supportMessagesCol().doc(id).delete();
}

/** Only the path: no query string or hash, which could carry tokens. */
export function cleanPage(page: string | null | undefined): string {
  const path = String(page || "").split(/[?#]/)[0].trim();
  return /^\/[\w\-./()[\]]{0,150}$/.test(path) ? path : "";
}
