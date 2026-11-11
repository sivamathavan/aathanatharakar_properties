// Security rules, checked against the Firestore and Storage emulators.
// Run with: npm run test:rules
import { after, before, beforeEach, describe, test } from "node:test";
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getBytes } from "firebase/storage";

let env: RulesTestEnvironment;
const bytes = (n: number) => new Uint8Array(n);

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-proppage",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8282 },
    storage: { rules: readFileSync("storage.rules", "utf8"), host: "127.0.0.1", port: 9199 },
  });
});

after(async () => env?.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "users/agentA"), { role: "AGENT", accountStatus: "ACTIVE", email: "a@x.in" });
    await setDoc(doc(db, "users/agentB"), { role: "AGENT", accountStatus: "ACTIVE", email: "b@x.in" });
    await setDoc(doc(db, "agents/agentA"), { slug: "a", plan: { id: "TRIAL", status: "TRIAL" } });
    await setDoc(doc(db, "properties/live"), { status: "ACTIVE", postedById: "agentA", title: "Live" });
    await setDoc(doc(db, "properties/hidden"), { status: "INACTIVE", postedById: "agentA", title: "Hidden" });
    await setDoc(doc(db, "properties/live/private/details"), { ownerPhone: "9876543210" });
    await setDoc(doc(db, "properties/mine"), { status: "ACTIVE", postedById: "admin1", ownerType: "ADMIN", title: "Admin's own" });
    await setDoc(doc(db, "properties/mine/private/details"), { ownerPhone: "9876500000" });
    await setDoc(doc(db, "leads/l1"), { ownerId: "agentA", phone: "9000000000" });
    await setDoc(doc(db, "config/plans"), { trialDays: 14 });
    await setDoc(doc(db, "crm_people/p1"), { name: "Owner" });
    await setDoc(doc(db, "paymentRequests/r1"), { agentId: "agentA", status: "PENDING" });
    await setDoc(doc(db, "agentBuyers/b1"), { ownerId: "agentA", name: "Buyer", phone: "9000000001" });
    await setDoc(doc(db, "agentDaily/agentA_2026-11-01"), { agentId: "agentA", date: "2026-11-01", pageViews: 3 });
    await setDoc(doc(db, "pushTokens/t_a"), { uid: "agentA", token: "fcm-token-a" });
    await setDoc(doc(db, "supportMessages/s1"), { agentId: "agentA", message: "My page is paused", status: "NEW" });
  });
});

const agentA = () => env.authenticatedContext("agentA", { role: "AGENT" }).firestore();
const agentB = () => env.authenticatedContext("agentB", { role: "AGENT" }).firestore();
const admin = () => env.authenticatedContext("admin1", { role: "ADMIN" }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("Firestore", () => {
  test("nobody can give themselves a role (the old admin takeover)", async () => {
    await assertFails(setDoc(doc(agentA(), "users/agentA"), { role: "ADMIN" }, { merge: true }));
    const stranger = env.authenticatedContext("stranger").firestore();
    await assertFails(setDoc(doc(stranger, "users/stranger"), { role: "ADMIN", accountStatus: "ACTIVE" }));
  });

  test("users read only their own profile", async () => {
    await assertSucceeds(getDoc(doc(agentA(), "users/agentA")));
    await assertFails(getDoc(doc(agentA(), "users/agentB")));
    await assertFails(getDocs(collection(agentA(), "users")));
  });

  test("the public sees live listings only", async () => {
    await assertSucceeds(getDoc(doc(anon(), "properties/live")));
    await assertFails(getDoc(doc(anon(), "properties/hidden")));
    await assertSucceeds(getDocs(query(collection(anon(), "properties"), where("status", "==", "ACTIVE"))));
    await assertFails(getDocs(collection(anon(), "properties")));
  });

  test("browsers can't write listings directly", async () => {
    await assertFails(setDoc(doc(agentA(), "properties/live"), { status: "ACTIVE", title: "x" }, { merge: true }));
    await assertFails(addDoc(collection(agentA(), "properties"), { status: "ACTIVE", postedById: "agentA" }));
  });

  test("owner contact is private to the listing's owner, the admin included", async () => {
    await assertSucceeds(getDoc(doc(agentA(), "properties/live/private/details")));
    await assertFails(getDoc(doc(admin(), "properties/live/private/details")));
    await assertSucceeds(getDoc(doc(admin(), "properties/mine/private/details")));
    await assertFails(getDoc(doc(agentB(), "properties/live/private/details")));
    await assertFails(getDoc(doc(anon(), "properties/live/private/details")));
  });

  test("leads, agents, payments and slugs are server-only", async () => {
    await assertFails(getDoc(doc(agentB(), "leads/l1")));
    await assertFails(getDoc(doc(agentA(), "leads/l1")));
    await assertFails(addDoc(collection(anon(), "leads"), { ownerId: "agentA" }));
    await assertFails(setDoc(doc(agentA(), "agents/agentA"), { plan: { id: "PRO", status: "ACTIVE" } }, { merge: true }));
    await assertFails(getDoc(doc(agentA(), "paymentRequests/r1")));
    await assertFails(addDoc(collection(agentA(), "paymentRequests"), { status: "APPROVED" }));
    await assertFails(setDoc(doc(agentA(), "agentSlugs/admin"), { uid: "agentA" }));
  });

  test("phone alert tokens are server-only", async () => {
    await assertFails(getDoc(doc(agentA(), "pushTokens/t_a")));
    await assertFails(getDoc(doc(admin(), "pushTokens/t_a")));
    await assertFails(setDoc(doc(agentB(), "pushTokens/t_b"), { uid: "agentA", token: "x" }));
  });

  test("an agent's buyers and daily stats are server-only, even for that agent", async () => {
    await assertFails(getDoc(doc(agentA(), "agentBuyers/b1")));
    await assertFails(getDoc(doc(agentB(), "agentBuyers/b1")));
    await assertFails(getDocs(query(collection(agentA(), "agentBuyers"), where("ownerId", "==", "agentA"))));
    await assertFails(addDoc(collection(agentA(), "agentBuyers"), { ownerId: "agentA", name: "x" }));
    await assertFails(getDoc(doc(agentA(), "agentDaily/agentA_2026-11-01")));
    await assertFails(setDoc(doc(anon(), "agentDaily/agentA_2026-11-01"), { pageViews: 999 }));
  });

  test("support messages are server-only: not even the sender or the admin reads them from a browser", async () => {
    await assertFails(getDoc(doc(agentA(), "supportMessages/s1")));
    await assertFails(getDoc(doc(admin(), "supportMessages/s1")));
    await assertFails(getDocs(collection(admin(), "supportMessages")));
    await assertFails(getDoc(doc(anon(), "supportMessages/s1")));
    await assertFails(addDoc(collection(anon(), "supportMessages"), { message: "spam", status: "NEW" }));
    await assertFails(addDoc(collection(agentA(), "supportMessages"), { agentId: "agentA", message: "hi", status: "NEW" }));
    await assertFails(setDoc(doc(admin(), "supportMessages/s1"), { status: "DONE" }, { merge: true }));
  });

  test("prices are public but nobody edits them from a browser", async () => {
    await assertSucceeds(getDoc(doc(anon(), "config/plans")));
    await assertFails(setDoc(doc(admin(), "config/plans"), { trialDays: 99 }));
  });

  test("the tracker is admin only", async () => {
    await assertSucceeds(getDoc(doc(admin(), "crm_people/p1")));
    await assertFails(getDoc(doc(agentA(), "crm_people/p1")));
    await assertFails(getDoc(doc(anon(), "crm_people/p1")));
    await assertFails(setDoc(doc(admin(), "crm_people/p2"), { name: "x" }));
  });
});

describe("Storage", () => {
  const st = (uid: string | null, role?: string) =>
    uid ? env.authenticatedContext(uid, role ? { role } : {}).storage() : env.unauthenticatedContext().storage();
  const jpeg = { contentType: "image/jpeg" };

  test("agents upload photos to their own folder only", async () => {
    await assertSucceeds(uploadBytes(ref(st("agentA", "AGENT"), "properties/agentA/p.jpg"), bytes(1000), jpeg));
    await assertFails(uploadBytes(ref(st("agentA", "AGENT"), "properties/agentB/p.jpg"), bytes(1000), jpeg));
    await assertFails(uploadBytes(ref(st(null), "properties/agentA/p.jpg"), bytes(1000), jpeg));
    await assertFails(uploadBytes(ref(st("noRole"), "properties/noRole/p.jpg"), bytes(1000), jpeg));
  });

  test("agents can't upload videos or huge files", async () => {
    await assertFails(uploadBytes(ref(st("agentA", "AGENT"), "properties/agentA/v.mp4"), bytes(1000), { contentType: "video/mp4" }));
    await assertFails(uploadBytes(ref(st("agentA", "AGENT"), "properties/agentA/big.jpg"), bytes(4 * 1024 * 1024), jpeg));
    await assertSucceeds(uploadBytes(ref(st("admin1", "ADMIN"), "properties/admin1/v.mp4"), bytes(1000), { contentType: "video/mp4" }));
  });

  test("anyone can view listing photos", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), "properties/agentA/seen.jpg"), bytes(10), jpeg);
    });
    await assertSucceeds(getBytes(ref(st(null), "properties/agentA/seen.jpg")));
  });

  test("title documents are admin only", async () => {
    await assertSucceeds(uploadBytes(ref(st("admin1", "ADMIN"), "crm-docs/p1/patta.pdf"), bytes(1000), { contentType: "application/pdf" }));
    await assertSucceeds(getBytes(ref(st("admin1", "ADMIN"), "crm-docs/p1/patta.pdf")));
    await assertFails(getBytes(ref(st("agentA", "AGENT"), "crm-docs/p1/patta.pdf")));
    await assertFails(getBytes(ref(st(null), "crm-docs/p1/patta.pdf")));
    await assertFails(uploadBytes(ref(st("agentA", "AGENT"), "crm-docs/p1/x.pdf"), bytes(10), { contentType: "application/pdf" }));
  });

  test("agents' own title documents are private to that agent", async () => {
    const pdf = { contentType: "application/pdf" };
    await assertSucceeds(uploadBytes(ref(st("agentA", "AGENT"), "agent-docs/agentA/live/patta.pdf"), bytes(1000), pdf));
    await assertSucceeds(uploadBytes(ref(st("agentA", "AGENT"), "agent-docs/agentA/live/ec.jpg"), bytes(1000), jpeg));
    await assertSucceeds(getBytes(ref(st("agentA", "AGENT"), "agent-docs/agentA/live/patta.pdf")));
    await assertFails(getBytes(ref(st("agentB", "AGENT"), "agent-docs/agentA/live/patta.pdf")));
    await assertFails(getBytes(ref(st(null), "agent-docs/agentA/live/patta.pdf")));
    await assertFails(uploadBytes(ref(st("agentB", "AGENT"), "agent-docs/agentA/live/x.pdf"), bytes(10), pdf));
    await assertFails(uploadBytes(ref(st("agentA", "AGENT"), "agent-docs/agentA/live/x.zip"), bytes(10), { contentType: "application/zip" }));
    await assertFails(uploadBytes(ref(st("agentA", "AGENT"), "agent-docs/agentA/live/big.pdf"), bytes(11 * 1024 * 1024), pdf));
  });
});
