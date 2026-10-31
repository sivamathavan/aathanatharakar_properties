// End-to-end smoke test against `next dev` + the Firebase emulators (demo project).
//   npm run emulators            (terminal 1)
//   npm run dev -- -p 3007       (terminal 2)
//   node tests/e2e/smoke.mjs     (terminal 3; reads E2E_ADMIN_* from .env.development.local)
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.development.local", import.meta.url), "utf8")
    .split("\n").filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const BASE = process.env.BASE || "http://localhost:3007";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const PROJECT = "demo-proppage";
const BUCKET = `${PROJECT}.appspot.com`;
const IMG = readFileSync(new URL("./sample.jpg", import.meta.url));
const RUN = Date.now().toString(36);

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  ✔ ${name}`); }
  else { fail++; console.log(`  ✖ ${name}${detail ? ` — ${detail}` : ""}`); }
}

async function authCall(path, body) {
  const res = await fetch(`${AUTH}/${path}?key=demo-key`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, returnSecureToken: true }) });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path}: ${JSON.stringify(data.error?.message)}`);
  return data;
}
const signIn = (email, password) => authCall("accounts:signInWithPassword", { email, password });
const signUp = (email, password) => authCall("accounts:signUp", { email, password });

async function session(idToken) {
  const res = await fetch(`${BASE}/api/auth/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
  const cookie = (res.headers.get("set-cookie") || "").match(/session=[^;]+/)?.[0];
  if (!res.ok || !cookie) throw new Error(`session failed ${res.status} ${await res.text()}`);
  return cookie;
}

async function call(path, { method = "GET", body, cookie, bearer } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, text, json };
}

async function upload(idToken, path) {
  const res = await fetch(`http://127.0.0.1:9199/v0/b/${BUCKET}/o?name=${encodeURIComponent(path)}`, {
    method: "POST", headers: { Authorization: `Firebase ${idToken}`, "Content-Type": "image/jpeg" }, body: IMG,
  });
  if (!res.ok) throw new Error(`upload ${res.status} ${await res.text()}`);
  return { url: `http://127.0.0.1:9199/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media`, type: "IMAGE", path };
}

const listing = (title, media, over = {}) => ({
  title, description: "Spacious corner plot with clear patta, near the main road.", type: "PLOT", listingType: "BUY",
  price: 2500000, priceUnit: "TOTAL", area: 5, areaUnit: "CENT", city: "Coimbatore", locality: "Vadavalli",
  address: "Near Maruthamalai Road", media, ownerName: "Rajan", ownerPhone: "9865432100", surveyNumber: "145/2A", ...over,
});

// Rate limits are real, so reruns start from a clean slate (emulator only).
async function clearRateLimits() {
  const base = `http://127.0.0.1:8282/v1/projects/${PROJECT}/databases/(default)/documents`;
  const res = await fetch(`${base}/rateLimits?pageSize=300`, { headers: { Authorization: "Bearer owner" } });
  const data = await res.json();
  for (const d of data.documents || []) await fetch(`http://127.0.0.1:8282/v1/${d.name}`, { method: "DELETE", headers: { Authorization: "Bearer owner" } });
}

async function main() {
  await clearRateLimits();
  console.log("Admin");
  const adminTok = await signIn(env.E2E_ADMIN_EMAIL, env.E2E_ADMIN_PASSWORD);
  const admin = await session(adminTok.idToken);
  check("admin gets a session cookie", !!admin);
  let r = await call("/api/admin/settings", { method: "PUT", cookie: admin, body: {
    plans: { trialDays: 14, boostPricePerWeek: 149, trial: { listingLimit: 5, photoLimit: 6 },
      starter: { priceMonthly: 299, priceYearly: 2999, listingLimit: 25, photoLimit: 10 }, pro: { priceMonthly: 699, priceYearly: 6999, listingLimit: 100, photoLimit: 15 } },
    site: { upiId: "proppage@okaxis", upiName: "PropPage", brokerWhatsapp: "919000000001", gstin: "" } } });
  check("admin saves prices and UPI details", r.status === 200, r.text);
  const adminMedia = await upload(adminTok.idToken, `properties/${adminTok.localId}/admin-${RUN}.jpg`);
  r = await call("/api/properties", { method: "POST", cookie: admin, body: listing(`Admin own plot ${RUN}`, [adminMedia]) });
  check("admin listing is created", r.status === 201, r.text);
  const adminPropId = r.json?.id;

  console.log("Agent signup");
  const email = `agent-${RUN}@proppage.test`, pw = `Pw-${RUN}-x9`;
  const phone = `9${String(Date.now()).slice(-9)}`;
  let a = await signUp(email, pw);
  r = await call("/api/register", { method: "POST", bearer: a.idToken, body: { name: "Ravi Kumar", phone, agencyName: `Ravi Realty ${RUN}`, city: "Coimbatore", role: "ADMIN" } });
  check("agent signs up and gets a trial", r.status === 201, r.text);
  const slug = r.json?.slug;
  const dup = await signUp(`dup-${RUN}@proppage.test`, pw);
  r = await call("/api/register", { method: "POST", bearer: dup.idToken, body: { name: "Copy", phone, agencyName: "", city: "Coimbatore" } });
  check("one free trial per phone number", r.status === 409, `${r.status} ${r.text}`);
  a = await signIn(email, pw);
  let agent = await session(a.idToken);
  const claims = JSON.parse(Buffer.from(a.idToken.split(".")[1], "base64url").toString());
  check("signup ignores a requested ADMIN role", claims.role === "AGENT", JSON.stringify(claims.role));

  console.log("Agent listings");
  const media1 = await upload(a.idToken, `properties/${a.localId}/p1-${RUN}.jpg`);
  r = await call("/api/properties", { method: "POST", cookie: agent, body: listing(`Ravi plot one ${RUN}`, [media1]) });
  check("agent adds a listing", r.status === 201, r.text);
  const agentPropId = r.json?.id;
  r = await call("/api/properties", { method: "POST", cookie: agent, body: listing("Stolen photo", [adminMedia]) });
  check("agent can't use someone else's photos", r.status === 400, `${r.status}`);
  r = await call("/api/properties", { method: "POST", cookie: agent, body: listing("Video", [{ ...media1, type: "VIDEO" }]) });
  check("agent can't attach videos", r.status === 400, `${r.status}`);
  r = await call(`/api/properties/${agentPropId}`, { cookie: agent });
  check("owner sees private owner details", r.json?.private?.ownerPhone === "9865432100");
  r = await call(`/api/properties/${agentPropId}`);
  check("public listing API hides private details", r.status === 200 && !r.text.includes("9865432100"));

  console.log("Share page");
  r = await call(`/a/${slug}`);
  check("page stays paused until email is confirmed", r.status === 200 && r.text.includes("paused"), `${r.status}`);
  await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`, {
    method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: JSON.stringify({ localId: a.localId, emailVerified: true }) });
  a = await signIn(email, pw);
  agent = await session(a.idToken);
  r = await call(`/a/${slug}`);
  check("share page shows the agent's listing", r.status === 200 && r.text.includes(`Ravi plot one ${RUN}`) && !r.text.includes("paused"), `${r.status}`);
  check("share page hides owner phone", !r.text.includes("9865432100"));
  r = await call(`/a/${slug}/${agentPropId}`);
  check("property share page has a WhatsApp preview image", r.status === 200 && r.text.includes('property="og:image"'));
  r = await call(`/a/${slug}/${adminPropId}`);
  check("another owner's listing is not shown under this agent", r.status === 404, `${r.status}`);

  console.log("Enquiries");
  r = await call(`/api/properties/${agentPropId}/enquiry`, { method: "POST", body: { name: `Visitor ${RUN}`, phone: "9123456780", message: "Is it negotiable?", source: "AGENT_PAGE" } });
  check("visitor sends an enquiry", r.status === 200, r.text);
  r = await call(`/api/properties/${agentPropId}/enquiry`, { method: "POST", body: { name: "Bot", phone: "9123456780", website: "spam.example" } });
  check("honeypot bot is silently dropped", r.status === 200);
  r = await call("/dashboard/enquiries", { cookie: agent });
  check("agent sees the enquiry in the inbox", r.text.includes(`Visitor ${RUN}`) && !r.text.includes(">Bot<"));

  console.log("Security");
  const b = await signUp(`b-${RUN}@proppage.test`, pw);
  await call("/api/register", { method: "POST", bearer: b.idToken, body: { name: "Other Agent", phone: `8${String(Date.now()).slice(-9)}`, agencyName: "", city: "Salem" } });
  const agentB = await session((await signIn(`b-${RUN}@proppage.test`, pw)).idToken);
  r = await call(`/api/properties/${agentPropId}`, { method: "PATCH", cookie: agentB, body: { status: "SOLD" } });
  check("an agent can't change another agent's listing", r.status === 403, `${r.status}`);
  r = await call(`/api/properties/${agentPropId}`, { cookie: agentB });
  check("an agent can't read another agent's private details", !r.text.includes("9865432100"));
  r = await call("/api/admin/settings", { method: "PUT", cookie: agent, body: {} });
  check("agents can't reach admin APIs", r.status === 401, `${r.status}`);
  r = await call("/api/admin/crm/people", { cookie: agent });
  check("agents can't read the tracker", r.status === 401, `${r.status}`);
  r = await call("/api/properties", { method: "POST", body: listing("anon", [media1]) });
  check("signed-out visitors can't create listings", r.status === 401, `${r.status}`);
  r = await call("/admin", { cookie: agent });
  check("agent opening /admin is sent away", r.status === 307 || r.status === 308 || (r.status === 200 && !r.text.includes("Paying agents")), `${r.status}`);

  console.log("Plan limits and payments");
  for (let i = 2; i <= 5; i++) {
    const m = await upload(a.idToken, `properties/${a.localId}/p${i}-${RUN}.jpg`);
    await call("/api/properties", { method: "POST", cookie: agent, body: listing(`Ravi plot ${i} ${RUN}`, [m]) });
  }
  const m6 = await upload(a.idToken, `properties/${a.localId}/p6-${RUN}.jpg`);
  r = await call("/api/properties", { method: "POST", cookie: agent, body: listing(`Ravi plot 6 ${RUN}`, [m6]) });
  check("trial stops at 5 listings", r.status === 402, `${r.status} ${r.text}`);
  const utr = `41${String(Date.now()).slice(-10)}`;
  r = await call("/api/agent/payment-requests", { method: "POST", cookie: agent, body: { kind: "PLAN", planId: "STARTER", period: "MONTHLY", utr, amount: 1 } });
  check("agent submits a UPI payment", r.status === 201, r.text);
  const payId = r.json?.id;
  r = await call("/api/agent/payment-requests", { method: "POST", cookie: agent, body: { kind: "PLAN", planId: "STARTER", period: "MONTHLY", utr } });
  check("the same UTR can't be used twice", r.status === 409, `${r.status}`);
  r = await call(`/api/admin/payments/${payId}`, { method: "PATCH", cookie: admin, body: { decision: "APPROVE" } });
  check("admin approves the payment", r.status === 200, r.text);
  r = await call(`/api/admin/payments/${payId}`, { method: "PATCH", cookie: admin, body: { decision: "APPROVE" } });
  check("a payment can't be approved twice", r.status === 400, `${r.status}`);
  r = await call("/dashboard/billing", { cookie: agent });
  check("agent is now on Starter at ₹299", r.text.includes("on Starter") && (r.text.includes("299")), "");
  r = await call("/api/properties", { method: "POST", cookie: agent, body: listing(`Ravi plot 6 ${RUN}`, [m6]) });
  check("Starter allows the 6th listing", r.status === 201, `${r.status} ${r.text}`);

  console.log("Suspend and restore");
  r = await call(`/api/admin/agents/${a.localId}`, { method: "PATCH", cookie: admin, body: { action: "suspend" } });
  check("admin suspends the agent", r.status === 200, r.text);
  r = await call(`/a/${slug}`);
  check("suspended agent's page is paused", r.text.includes("paused"));
  r = await call(`/api/properties/${agentPropId}/enquiry`, { method: "POST", body: { name: "Late visitor", phone: "9123456780" } });
  check("no enquiries reach a paused page", r.status === 404, `${r.status}`);
  r = await call(`/api/admin/agents/${a.localId}`, { method: "PATCH", cookie: admin, body: { action: "restore" } });
  r = await call(`/a/${slug}`);
  check("restored agent's page is live again", !r.text.includes("paused") && r.text.includes(`Ravi plot one ${RUN}`));

  console.log("Boost onto the main site");
  r = await call("/properties");
  check("agent listing is not on the main site before a boost", !r.text.includes(`Ravi plot one ${RUN}`));
  r = await call("/api/agent/payment-requests", { method: "POST", cookie: agent, body: { kind: "BOOST", propertyId: agentPropId, weeks: 2, utr: `42${String(Date.now()).slice(-10)}` } });
  const boostId = r.json?.id;
  check("agent requests a 2-week boost", r.status === 201, r.text);
  r = await call(`/api/admin/payments/${boostId}`, { method: "PATCH", cookie: admin, body: { decision: "APPROVE" } });
  check("admin approves the boost", r.status === 200, r.text);
  r = await call("/properties");
  check("boosted listing appears on the main site", r.text.includes(`Ravi plot one ${RUN}`));
  r = await call(`/properties/${agentPropId}`);
  check("main-site page for a boosted listing calls the agent", r.status === 200 && r.text.includes("Ravi Kumar"));

  console.log("Tracker");
  r = await call("/api/admin/crm/people", { method: "POST", cookie: admin, body: { name: `Ganesh ${RUN}`, person_type: "Buyer", buyer_budget: 3000000, district: "Coimbatore", role: "ADMIN", created_by: "hacker" } });
  check("admin adds a buyer", r.status === 201, r.text);
  check("unknown fields are dropped (no mass assignment)", r.json?.data && !("role" in r.json.data) && r.json.data.created_by !== "hacker");
  r = await call("/api/admin/crm/deals", { method: "POST", cookie: admin, body: { title: `Vadavalli deal ${RUN}`, deal_type: "Both Side Broker", status: "Negotiation", property_value: 4500000, commission_rate_seller: 1.5, commission_rate_buyer: 1, commission_amount: 999999 } });
  check("deal commission is worked out by the server", r.status === 201 && r.json?.data?.commission_amount === 112500, JSON.stringify(r.json?.data?.commission_amount));
  const dealId = r.json?.data?.id;
  r = await call("/api/admin/crm/ledger", { method: "POST", cookie: admin, body: { direction: "IN", deal_id: dealId, person_name: "Seller", amount: 50000, settled: true, date: "2026-10-31" } });
  check("admin records commission received", r.status === 201, r.text);
  r = await call("/api/admin/crm/deals", { cookie: admin });
  const d = r.json?.data?.find((x) => x.id === dealId);
  check("deal shows ₹50,000 received from the ledger", d?.commission_received === 50000, JSON.stringify(d?.commission_received));
  r = await call("/api/admin/crm/properties", { cookie: admin });
  check("tracker inventory shows the admin's own listing with private owner", r.json?.data?.some((p) => p.id === adminPropId && p.owner_name === "Rajan"));
  check("tracker inventory excludes agents' listings", !r.json?.data?.some((p) => p.id === agentPropId));
  r = await call(`/api/admin/crm/properties/${adminPropId}`, { method: "PATCH", cookie: admin, body: { docChecklist: { Patta: { status: "VERIFIED" } } } });
  check("admin marks Patta verified", r.status === 200, r.text);

  console.log("Website enquiry → deal");
  r = await call(`/api/properties/${adminPropId}/enquiry`, { method: "POST", body: { name: `Buyer ${RUN}`, phone: "9988776655", message: "Call me" } });
  r = await call("/api/admin/leads", { cookie: admin });
  const lead = r.json?.find?.((l) => l.name === `Buyer ${RUN}`);
  check("enquiry on admin listing reaches admin", !!lead);
  check("admin does not see agents' clients", !r.json?.some?.((l) => l.name === `Visitor ${RUN}`));
  r = await call(`/api/admin/leads/${lead?.id}/convert`, { method: "POST", cookie: admin });
  check("enquiry converts to a tracker deal", r.status === 201, r.text);
  r = await call(`/api/admin/leads/${lead?.id}/convert`, { method: "POST", cookie: admin });
  check("converting twice doesn't duplicate the deal", r.json?.existed === true);
  r = await call(`/api/leads/${lead?.id}`, { cookie: agent });
  check("agents can't open the admin's enquiries", r.status === 404, `${r.status}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});
