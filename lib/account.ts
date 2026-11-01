// Download-my-data and delete-my-account for agents (India DPDP Act). Server only.
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import {
  agentSlugsCol, agentsCol, docToTyped, getAgentById, getUserById, leadNotesCol, leadsCol, paymentRequestsCol, propertiesCol, privateDetailsRef, trialPhonesCol, usersCol, writeAudit,
} from "@/lib/firestore";
import { agentBuyersCol } from "@/lib/buyers";
import { agentDailyCol } from "@/lib/stats";
import { trialPhoneKey } from "@/lib/trial";

const plain = (snap: FirebaseFirestore.QuerySnapshot) => snap.docs.map((d) => docToTyped<Record<string, unknown>>(d)!);

/** Everything stored about the agent, as one JSON-friendly object. */
export async function exportAgentData(uid: string) {
  const [user, agent, props, leads, buyers, payments, daily] = await Promise.all([
    getUserById(uid),
    getAgentById(uid),
    propertiesCol().where("postedById", "==", uid).get(),
    leadsCol().where("ownerId", "==", uid).get(),
    agentBuyersCol().where("ownerId", "==", uid).get(),
    paymentRequestsCol().where("agentId", "==", uid).get(),
    agentDailyCol().where("agentId", "==", uid).get(),
  ]);
  const privates = props.size ? await adminDb.getAll(...props.docs.map((d) => privateDetailsRef(d.id))) : [];
  const privateById = new Map(privates.map((p) => [p.ref.parent.parent!.id, p.exists ? docToTyped<Record<string, unknown>>(p) : null]));
  const leadIds = leads.docs.map((d) => d.id);
  const notes: Record<string, unknown>[] = [];
  for (let i = 0; i < leadIds.length; i += 30) {
    notes.push(...plain(await leadNotesCol().where("leadId", "in", leadIds.slice(i, i + 30)).get()));
  }
  return {
    exportedAt: new Date().toISOString(),
    account: user,
    profile: agent,
    listings: plain(props).map((p) => ({ ...p, private: privateById.get(p.id as string) || null })),
    enquiries: plain(leads).map((l) => ({ ...l, notes: notes.filter((n) => n.leadId === l.id) })),
    buyers: plain(buyers),
    payments: plain(payments),
    dailyStats: plain(daily),
  };
}

async function deleteAll(query: FirebaseFirestore.Query) {
  for (;;) {
    const snap = await query.limit(400).get();
    if (snap.empty) return;
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 400) return;
  }
}

/**
 * Erase the agent: listings (and their photos and documents), enquiries and
 * notes, buyers, stats, link names, profile and login. Payment records stay
 * (tax law) and the trial record keeps only a hash of the phone number.
 */
export async function deleteAgentAccount(uid: string): Promise<{ slug: string | null; slugs: string[] }> {
  const agent = await getAgentById(uid);
  const props = await propertiesCol().where("postedById", "==", uid).select().get();
  for (let i = 0; i < props.docs.length; i += 200) {
    const batch = adminDb.batch();
    props.docs.slice(i, i + 200).forEach((d) => {
      batch.delete(privateDetailsRef(d.id));
      batch.delete(d.ref);
    });
    await batch.commit();
  }
  const bucket = adminStorage.bucket();
  await Promise.all(
    [`properties/${uid}/`, `agents/${uid}/`, `agent-docs/${uid}/`].map((prefix) => bucket.deleteFiles({ prefix }).catch(() => {}))
  );

  const leads = await leadsCol().where("ownerId", "==", uid).select().get();
  const leadIds = leads.docs.map((d) => d.id);
  for (let i = 0; i < leadIds.length; i += 30) await deleteAll(leadNotesCol().where("leadId", "in", leadIds.slice(i, i + 30)));
  await deleteAll(leadsCol().where("ownerId", "==", uid));
  await deleteAll(agentBuyersCol().where("ownerId", "==", uid));
  await deleteAll(agentDailyCol().where("agentId", "==", uid));

  const slugs = await agentSlugsCol().where("uid", "==", uid).get();
  const batch = adminDb.batch();
  slugs.docs.forEach((d) => batch.delete(d.ref));
  if (agent?.phone) batch.set(trialPhonesCol().doc(trialPhoneKey(agent.phone)), { uid: null, deletedAt: new Date() }, { merge: true });
  batch.delete(agentsCol().doc(uid));
  batch.delete(usersCol().doc(uid));
  await batch.commit();

  await adminAuth.deleteUser(uid).catch((e) => {
    if (e?.code !== "auth/user-not-found") throw e;
  });
  await writeAudit(uid, "agent.delete", uid, { listings: props.size, enquiries: leadIds.length });
  return { slug: agent?.slug || null, slugs: slugs.docs.map((d) => d.id) };
}
