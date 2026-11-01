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
const OWNER = { Authorization: "Bearer owner", "Content-Type": "application/json" };
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

  console.log("Voice listing");
  r = await call("/api/ai/listing-draft", { method: "POST", body: { text: "5 cent plot in Coimbatore, 25 lakhs" } });
  check("voice listing needs sign-in", r.status === 401, `${r.status}`);
  r = await call("/api/ai/listing-draft", { method: "POST", cookie: agent, body: { text: "plot" } });
  check("too little text is refused politely", r.status === 400, `${r.status}`);
  r = await call("/api/ai/listing-draft", { method: "POST", cookie: agent, body: { text: "5 cent plot in Coimbatore, 30 ft road, 25 lakhs" } });
  check("spoken listing fills price, size and city", r.status === 200 && r.json?.values?.price === "2500000" && r.json?.values?.areaUnit === "CENT" && r.json?.values?.city === "Coimbatore", r.text.slice(0, 200));
  check("trial shows voice listings left this month", r.json?.remaining === 9, JSON.stringify(r.json?.remaining));
  for (let i = 0; i < 9; i++) await call("/api/ai/listing-draft", { method: "POST", cookie: agent, body: { text: "3 acre farm land near Madurai, 60 lakhs" } });
  r = await call("/api/ai/listing-draft", { method: "POST", cookie: agent, body: { text: "3 acre farm land near Madurai, 60 lakhs" } });
  check("trial stops at 10 voice listings a month", r.status === 429 && r.text.includes("10"), `${r.status} ${r.text}`);
  r = await call("/api/ai/listing-draft", { method: "POST", cookie: admin, body: { text: "2BHK house for rent in Salem, 15k per month" } });
  check("admin voice listing has no monthly cap", r.status === 200 && r.json?.remaining === null && r.json?.values?.priceUnit === "PER_MONTH", r.text.slice(0, 200));

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

  console.log("Branding and link name");
  const logo = await upload(a.idToken, `agents/${a.localId}/logo-${RUN}.jpg`);
  r = await call("/api/agent/profile", { method: "PUT", cookie: agent, body: { displayName: "Ravi Kumar", agencyName: `Ravi Realty ${RUN}`, whatsapp: phone, city: "Coimbatore", bio: "", reraNumber: "TN/1/2026", photoUrl: "", logoUrl: logo.url } });
  check("Starter agent can add a logo (logo is on every plan)", r.status === 200, r.text);
  const brand = { brandColor: "maroon", tagline: "Plots in Vadavalli", officeAddress: "12 Cross Cut Road", languages: ["Tamil", "English"], social: { website: "", facebook: "https://facebook.com/ravi", instagram: "", youtube: "" }, coverUrl: "", hideFooter: true, showSold: true };
  r = await call("/api/agent/branding", { method: "PUT", cookie: agent, body: brand });
  check("agent saves colour, tagline, office, languages, links", r.status === 200, r.text);
  r = await call("/api/agent/branding", { method: "PUT", cookie: agent, body: { ...brand, brandColor: "neon" } });
  check("only the preset colours are accepted", r.status === 400, `${r.status}`);
  r = await call("/api/agent/branding", { method: "PUT", cookie: agent, body: { ...brand, social: { ...brand.social, website: "javascript:alert(1)" } } });
  check("social links must be https", r.status === 400, `${r.status}`);
  r = await call(`/a/${slug}`);
  check("public page shows logo, tagline and RERA", r.text.includes(encodeURIComponent(`agents/${a.localId}/logo-${RUN}.jpg`).slice(0, 30)) && r.text.includes("Plots in Vadavalli") && r.text.includes("TN/1/2026"));
  check("public page has RealEstateAgent search data", r.text.includes('"@type":"RealEstateAgent"'));
  check("Starter can't hide the footer (Pro extra)", r.text.includes("Page made with"));
  r = await call(`/api/agent/slug?slug=admin`, { cookie: agent });
  check("reserved link names are refused", r.json?.ok === false, r.text);
  const newSlug = `ravi-${RUN}`;
  r = await call("/api/agent/slug", { method: "POST", cookie: agent, body: { slug: newSlug } });
  check("agent chooses a link name", r.status === 200 && r.json?.slug === newSlug, r.text);
  r = await call("/api/agent/slug", { method: "POST", cookie: agent, body: { slug: `${newSlug}-again` } });
  check("the link name can be chosen only once", r.status === 409, `${r.status}`);
  r = await call(`/a/${slug}`);
  check("the old link redirects to the new one", [307, 308].includes(r.status), `${r.status}`);
  r = await call(`/a/${slug}/${agentPropId}`);
  check("old listing links redirect too", [307, 308].includes(r.status), `${r.status}`);
  r = await call(`/api/properties/${agentPropId}`, { cookie: agent });
  check("listings move to the new link name", r.json?.agentSlug === newSlug, r.json?.agentSlug);
  let res = await fetch(`${BASE}/a/${newSlug}/${agentPropId}/opengraph-image`);
  check("listing WhatsApp preview image renders", res.status === 200 && res.headers.get("content-type") === "image/png", `${res.status} ${res.headers.get("content-type")}`);
  res = await fetch(`${BASE}/a/${newSlug}/opengraph-image`);
  check("agent page preview image renders", res.status === 200 && res.headers.get("content-type") === "image/png", `${res.status}`);
  r = await call(`/a/${newSlug}/${agentPropId}`);
  check("listing page has RealEstateListing search data and a canonical link", r.text.includes('"@type":"RealEstateListing"') && r.text.includes(`rel="canonical"`));
  r = await call(`/api/agent/media?src=${encodeURIComponent(logo.url)}`, { cookie: agent });
  check("poster images load through the agent's own media route", r.status === 200);
  r = await call(`/api/agent/media?src=${encodeURIComponent(logo.url)}`, { cookie: agentB });
  check("another agent can't fetch them", r.status === 404, `${r.status}`);

  console.log("Follow-ups, site visits, clients added by hand");
  r = await call("/api/leads", { method: "POST", cookie: agent, body: { name: `Walk-in ${RUN}`, phone: "9443012345", source: "DIRECT", propertyId: agentPropId, message: "Wants a corner plot" } });
  check("agent adds a client who phoned", r.status === 201, r.text);
  const manualId = r.json?.id;
  r = await call("/api/leads", { method: "POST", cookie: agent, body: { name: "X", phone: "1", source: "DIRECT" } });
  check("bad client details are refused", r.status === 400, `${r.status}`);
  r = await call("/api/leads", { method: "POST", cookie: agentB, body: { name: "Steal", phone: "9443012345", source: "DIRECT", propertyId: agentPropId } });
  check("an agent can't attach a client to someone else's listing", r.status === 404, `${r.status}`);
  const soon = new Date(Date.now() - 60000).toISOString();
  const visit = new Date(Date.now() + 3600000).toISOString();
  r = await call(`/api/leads/${manualId}`, { method: "PATCH", cookie: agent, body: { nextFollowUpAt: soon, siteVisitDate: visit } });
  check("follow-up and site visit are saved", r.status === 200 && !!r.json?.nextFollowUpAt && !!r.json?.siteVisitDate, r.text.slice(0, 200));
  check("booking a visit moves the enquiry to Site visit", r.json?.status === "SITE_VISIT", r.json?.status);
  r = await call(`/api/leads/${manualId}`, { method: "PATCH", cookie: agentB, body: { nextFollowUpAt: null } });
  check("another agent can't touch it", r.status === 404, `${r.status}`);
  r = await call("/dashboard", { cookie: agent });
  check("overview lists today's follow-up", r.text.includes(`Walk-in ${RUN}`) && r.text.includes("Follow up"));

  console.log("Buyers and matching");
  r = await call("/api/buyers", { method: "POST", cookie: agent, body: { name: `Buyer Priya ${RUN}`, phone: "9500011122", listingType: "BUY", types: ["PLOT"], city: "Coimbatore", localities: ["Vadavalli"], budgetMin: 2000000, budgetMax: 3000000, leadId: manualId } });
  check("agent saves a buyer's requirement", r.status === 201, r.text);
  const buyerId = r.json?.id;
  r = await call("/api/buyers", { method: "POST", cookie: agent, body: { name: "Bad budget", phone: "9500011122", listingType: "BUY", budgetMin: 5000000, budgetMax: 1000000 } });
  check("min budget above max is refused", r.status === 400, `${r.status}`);
  r = await call("/api/buyers", { method: "POST", cookie: agentB, body: { name: "Linked", phone: "9500011122", listingType: "BUY", leadId: manualId } });
  check("a buyer can't be linked to another agent's enquiry", r.status === 404, `${r.status}`);
  r = await call(`/api/buyers/${buyerId}`, { method: "PUT", cookie: agentB, body: { name: "x", phone: "9500011122", listingType: "BUY" } });
  check("another agent can't edit the buyer", r.status === 404, `${r.status}`);
  r = await call("/dashboard/buyers", { cookie: agent });
  check("buyers page shows matching listings", r.text.includes(`Buyer Priya ${RUN}`) && r.text.includes(`Ravi plot one ${RUN}`));
  r = await call("/dashboard/buyers", { cookie: agentB });
  check("other agents don't see the buyer", !r.text.includes(`Buyer Priya ${RUN}`));

  console.log("Title documents");
  r = await call(`/api/properties/${agentPropId}/docs`, { method: "PUT", cookie: agent, body: { items: { Patta: { status: "VERIFIED" }, "EC (Encumbrance)": { status: "RECEIVED" } } } });
  check("agent marks Patta verified on their listing", r.status === 200, r.text);
  r = await call(`/api/properties/${agentPropId}/docs`, { method: "PUT", cookie: agent, body: { items: { Patta: { status: "VERIFIED", fileUrl: "https://x.example/f.pdf", filePath: `agent-docs/${b.localId}/x/f.pdf` } } } });
  check("document files must be in the agent's own folder", r.status === 400, `${r.status}`);
  r = await call(`/api/properties/${agentPropId}/docs`, { method: "PUT", cookie: agentB, body: { items: {} } });
  check("another agent can't change the checklist", r.status === 404, `${r.status}`);
  r = await call("/dashboard/properties", { cookie: agent });
  check("listings show document progress and matching buyers", r.text.includes("1/11") && (r.text.includes("1 buyer matches") || r.text.includes("buyers match")));
  r = await call(`/a/${newSlug}/${agentPropId}`);
  check("documents never appear on the public page", !r.text.includes("EC (Encumbrance)"));

  console.log("Stats");
  r = await call("/api/track", { method: "POST", body: { kind: "wa", agentId: a.localId, propertyId: agentPropId } });
  check("a WhatsApp tap is counted", r.json?.counted === true, r.text);
  r = await call("/api/track", { method: "POST", body: { kind: "wa", agentId: a.localId, propertyId: agentPropId } });
  check("repeat taps from the same visitor are not", r.json?.counted === false, r.text);
  r = await call("/api/track", { method: "POST", body: { kind: "call", agentId: b.localId, propertyId: agentPropId } });
  check("taps can't be credited to the wrong agent", r.json?.counted === false, r.text);
  r = await call(`/api/properties/${agentPropId}`, { cookie: agent });
  check("listing keeps WhatsApp and enquiry counts", r.json?.waTaps >= 1 && r.json?.enquiryCount >= 1, `${r.json?.waTaps} ${r.json?.enquiryCount}`);
  r = await call("/dashboard/stats", { cookie: agent });
  check("stats page loads with per-listing numbers", r.status === 200 && r.text.includes(`Ravi plot one ${RUN}`));

  console.log("Sold history and plan slots");
  const c = await signUp(`c-${RUN}@proppage.test`, pw);
  const cPhone = `7${String(Date.now()).slice(-9)}`;
  await call("/api/register", { method: "POST", bearer: c.idToken, body: { name: "Selvi", phone: cPhone, agencyName: "", city: "Madurai" } });
  const cAuth = await signIn(`c-${RUN}@proppage.test`, pw);
  const agentC = await session(cAuth.idToken);
  const cIds = [];
  for (let i = 1; i <= 5; i++) {
    const m = await upload(cAuth.idToken, `properties/${cAuth.localId}/c${i}-${RUN}.jpg`);
    cIds.push((await call("/api/properties", { method: "POST", cookie: agentC, body: listing(`Selvi plot ${i} ${RUN}`, [m]) })).json?.id);
  }
  const cm = await upload(cAuth.idToken, `properties/${cAuth.localId}/c6-${RUN}.jpg`);
  r = await call("/api/properties", { method: "POST", cookie: agentC, body: listing(`Selvi plot 6 ${RUN}`, [cm]) });
  check("trial is full at 5 listings", r.status === 402, `${r.status}`);
  r = await call(`/api/properties/${cIds[0]}`, { method: "PATCH", cookie: agentC, body: { status: "SOLD", soldPrice: 2400000, soldTo: "Kumar", soldAt: new Date().toISOString() } });
  check("agent marks a listing sold with price and buyer", r.status === 200, r.text);
  r = await call(`/api/properties/${cIds[0]}`, { cookie: agentC });
  check("sold price and buyer stay private to the owner", r.json?.private?.soldPrice === 2400000 && r.json?.private?.soldTo === "Kumar" && !!r.json?.soldAt);
  r = await call("/api/properties", { method: "POST", cookie: agentC, body: listing(`Selvi plot 6 ${RUN}`, [cm]) });
  check("a sold listing frees its slot", r.status === 201, `${r.status} ${r.text}`);
  r = await call(`/api/properties/${cIds[0]}`, { method: "PATCH", cookie: agentC, body: { status: "ACTIVE" } });
  check("bringing it back needs a free slot", r.status === 402, `${r.status}`);

  console.log("Every screen renders");
  const broken = (t) => t.includes("This page didn") || t.includes("Application error") || t.includes("is not a function");
  for (const path of ["/dashboard", "/dashboard/properties", "/dashboard/properties/new", `/dashboard/properties/${agentPropId}/edit`, "/dashboard/enquiries", "/dashboard/enquiries?view=today", "/dashboard/buyers", "/dashboard/stats", "/dashboard/share", "/dashboard/profile", "/dashboard/billing", "/dashboard/account"]) {
    r = await call(path, { cookie: agent });
    check(`agent screen ${path} renders`, r.status === 200 && !broken(r.text), `${r.status}`);
  }
  for (const path of ["/admin", "/admin/properties", `/admin/properties/${adminPropId}/edit`, "/admin/leads", "/admin/agents", "/admin/payments", "/admin/analytics", "/admin/settings", "/admin/tracker"]) {
    r = await call(path, { cookie: admin });
    check(`admin screen ${path} renders`, r.status === 200 && !broken(r.text), `${r.status}`);
  }

  console.log("Tamil, reminders, analytics");
  r = await call("/api/agent/prefs", { method: "PUT", cookie: agent, body: { uiLang: "ta", shared: true } });
  check("agent saves language and first share", r.status === 200, r.text);
  r = await call("/dashboard", { cookie: `${agent}; lang=ta` });
  check("dashboard shows in Tamil", r.text.includes("விசாரணைகள்") && r.text.includes("வணக்கம்"));
  r = await call("/api/cron/daily", { method: "POST" });
  check("reminder job refuses calls without the secret", r.status === 401 || r.status === 503, `${r.status}`);
  if (env.CRON_SECRET) {
    res = await fetch(`${BASE}/api/cron/daily?dry=1`, { method: "POST", headers: { Authorization: `Bearer ${env.CRON_SECRET}` } });
    const j = await res.json();
    check("reminder job finds today's follow-ups (dry run)", res.status === 200 && j.ok && j.digests >= 1, JSON.stringify(j));
  }
  r = await call("/admin/analytics", { cookie: admin });
  check("admin sees the signup funnel", r.status === 200 && r.text.includes("Signup funnel"));
  r = await call("/admin/analytics", { cookie: agent });
  check("agents can't open analytics", r.status !== 200 || !r.text.includes("Signup funnel"), `${r.status}`);

  console.log("Download my data and delete my account");
  res = await fetch(`${BASE}/api/agent/export`, { headers: { cookie: agentC } });
  const exported = await res.json();
  check("agent downloads all their data", res.status === 200 && (res.headers.get("content-disposition") || "").includes("attachment") && exported.listings?.length === 6 && exported.profile?.phone === cPhone);
  r = await call("/api/agent/account", { method: "DELETE", cookie: agentC, body: { confirm: "DELETE" } });
  check("deleting needs a fresh password check", r.status === 401, `${r.status}`);
  const fresh = await signIn(`c-${RUN}@proppage.test`, pw);
  r = await call("/api/agent/account", { method: "DELETE", bearer: fresh.idToken, body: { confirm: "nope" } });
  check("deleting needs the word DELETE", r.status === 400, `${r.status}`);
  r = await call("/api/agent/account", { method: "DELETE", bearer: fresh.idToken, body: { confirm: "DELETE" } });
  check("agent deletes their account", r.status === 200, r.text);
  const gone = await fetch(`http://127.0.0.1:8282/v1/projects/${PROJECT}/databases/(default)/documents/properties/${cIds[1]}`, { headers: OWNER });
  check("their listings are erased", gone.status === 404, `${gone.status}`);
  const login = await fetch(`${AUTH}/accounts:signInWithPassword?key=demo-key`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: `c-${RUN}@proppage.test`, password: pw, returnSecureToken: true }) });
  check("their login is removed", login.status === 400, `${login.status}`);
  const again = await signUp(`c2-${RUN}@proppage.test`, pw);
  r = await call("/api/register", { method: "POST", bearer: again.idToken, body: { name: "Selvi again", phone: cPhone, agencyName: "", city: "Madurai" } });
  check("the same phone can't start a second free trial", r.status === 409 && r.text.includes("free trial"), `${r.status} ${r.text}`);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error("Smoke test crashed:", e);
  process.exit(1);
});
