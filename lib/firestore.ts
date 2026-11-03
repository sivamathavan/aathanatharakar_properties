// Firestore collection helpers. Server-side only (firebase-admin).
// Browsers never talk to Firestore directly; every read and write goes
// through these helpers from server components or API routes.
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { mergePlans, waNumber } from "@/lib/plans";
import { BRAND } from "@/lib/brand";
import {
  AgentDoc,
  BlogPostDoc,
  LeadDoc,
  LeadNoteDoc,
  PaymentRequestDoc,
  PlansConfig,
  PropertyDoc,
  PropertyPrivateDoc,
  PropertyStatus,
  RateLimitDoc,
  SiteConfig,
  UserDoc,
} from "@/types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { phoneKey } from "@/lib/wa-paste";

// ─── Collection References ──────────────────────────────────────────────────

export const usersCol = () => adminDb.collection("users");
export const agentsCol = () => adminDb.collection("agents");
export const agentSlugsCol = () => adminDb.collection("agentSlugs");
export const trialPhonesCol = () => adminDb.collection("trialPhones");
export const propertiesCol = () => adminDb.collection("properties");
export const leadsCol = () => adminDb.collection("leads");
export const leadNotesCol = () => adminDb.collection("leadNotes");
export const paymentRequestsCol = () => adminDb.collection("paymentRequests");
export const configCol = () => adminDb.collection("config");
export const blogPostsCol = () => adminDb.collection("blogPosts");
export const rateLimitsCol = () => adminDb.collection("rateLimits");
export const auditLogCol = () => adminDb.collection("auditLog");

export const privateDetailsRef = (propertyId: string) =>
  propertiesCol().doc(propertyId).collection("private").doc("details");

// ─── Timestamp Helpers ──────────────────────────────────────────────────────

function convert(value: any): any {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(convert);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) out[k] = convert(v);
    return out;
  }
  return value;
}

export function docToTyped<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  return { id: doc.id, ...convert(doc.data()) } as T;
}

const DATE_FIELDS = ["createdAt", "updatedAt", "boostUntil"];

// unstable_cache serialises to JSON, so dates come back as strings.
function reviveDates<T>(item: any): T {
  const out = { ...item };
  for (const f of DATE_FIELDS) if (out[f]) out[f] = new Date(out[f]);
  return out as T;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function getUserById(uid: string): Promise<UserDoc | null> {
  return docToTyped<UserDoc>(await usersCol().doc(uid).get());
}

export async function updateUser(uid: string, data: Partial<UserDoc>): Promise<void> {
  await usersCol().doc(uid).update({ ...data, updatedAt: new Date() });
}

export async function getAllUsers(): Promise<UserDoc[]> {
  const snap = await usersCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<UserDoc>(d)!);
}

// ─── Agents ─────────────────────────────────────────────────────────────────

export async function getAgentById(uid: string): Promise<AgentDoc | null> {
  return docToTyped<AgentDoc>(await agentsCol().doc(uid).get());
}

export async function getAgentBySlug(slug: string): Promise<AgentDoc | null> {
  const slugDoc = await agentSlugsCol().doc(slug.toLowerCase()).get();
  if (!slugDoc.exists) return null;
  return getAgentById(slugDoc.data()!.uid);
}

export async function listAgents(): Promise<AgentDoc[]> {
  const snap = await agentsCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<AgentDoc>(d)!);
}

// ─── Config ─────────────────────────────────────────────────────────────────

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  upiId: "",
  upiName: BRAND.company,
  brokerWhatsapp: BRAND.supportWhatsapp,
  gstin: "",
};

// Defaults keep pages working (e.g. during a build) if config can't be read.
export async function getPlansConfig(): Promise<PlansConfig> {
  try {
    const doc = await configCol().doc("plans").get();
    return mergePlans(doc.exists ? (doc.data() as Partial<PlansConfig>) : null);
  } catch (err) {
    console.error("[config/plans]", err);
    return mergePlans(null);
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const doc = await configCol().doc("site").get();
    return { ...DEFAULT_SITE_CONFIG, ...(doc.exists ? (doc.data() as Partial<SiteConfig>) : {}) };
  } catch (err) {
    console.error("[config/site]", err);
    return DEFAULT_SITE_CONFIG;
  }
}

// ─── Properties ─────────────────────────────────────────────────────────────

export async function getPropertyById(id: string): Promise<PropertyDoc | null> {
  const property = docToTyped<PropertyDoc>(await propertiesCol().doc(id).get());
  if (property && !Array.isArray(property.media)) property.media = [];
  return property;
}

export async function getPropertyPrivate(id: string): Promise<PropertyPrivateDoc> {
  const doc = await privateDetailsRef(id).get();
  return (doc.exists ? convert(doc.data()) : {}) as PropertyPrivateDoc;
}

const MARKETPLACE_CAP = 300;

// One indexed query (status, onMarketplace, createdAt) shared by every visitor
// for 60 seconds. Filters run on this bounded set, so a search never scans the
// collection and Firestore reads stay flat as traffic grows.
const loadMarketplaceCandidates = unstable_cache(
  async () => {
    const snap = await propertiesCol()
      .where("status", "==", PropertyStatus.ACTIVE)
      .where("onMarketplace", "==", true)
      .orderBy("createdAt", "desc")
      .limit(MARKETPLACE_CAP)
      .get();
    return snap.docs.map((d) => JSON.parse(JSON.stringify(docToTyped<PropertyDoc>(d))));
  },
  ["marketplace-candidates"],
  { revalidate: 60, tags: ["properties"] }
);

export interface PropertyFilters {
  limit?: number;
  offset?: number;
  featured?: boolean;
  type?: string;
  city?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  listingType?: string;
  sort?: string;
}

export function filterProperties(all: PropertyDoc[], options: PropertyFilters = {}) {
  let docs = all;
  if (options.featured) docs = docs.filter((p) => p.isFeatured);
  if (options.type) docs = docs.filter((p) => p.type === options.type);
  if (options.city) docs = docs.filter((p) => p.city === options.city);
  if (options.bedrooms) docs = docs.filter((p) => p.bedrooms === options.bedrooms);
  if (options.listingType) docs = docs.filter((p) => p.listingType === options.listingType || (options.listingType === "BUY" && p.listingType === "SELL"));
  if (options.minPrice !== undefined) docs = docs.filter((p) => p.price >= options.minPrice!);
  if (options.maxPrice !== undefined) docs = docs.filter((p) => p.price <= options.maxPrice!);
  if (options.search) {
    const words = options.search.toLowerCase().split(/\s+/).filter(Boolean);
    docs = docs.filter((p) => {
      const hay = `${p.title} ${p.locality} ${p.city} ${p.address} ${p.description}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  docs = [...docs];
  if (options.sort === "price_asc") docs.sort((a, b) => a.price - b.price);
  else if (options.sort === "price_desc") docs.sort((a, b) => b.price - a.price);
  else docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return docs;
}

/** Listings on the main site: the admin's own, plus agent listings with a live boost. */
export async function getActiveProperties(options: PropertyFilters = {}): Promise<{ properties: PropertyDoc[]; total: number }> {
  const now = Date.now();
  const candidates = (await loadMarketplaceCandidates())
    .map((p: any) => reviveDates<PropertyDoc>(p))
    .filter((p) => p.ownerType !== "AGENT" || (p.boostUntil && new Date(p.boostUntil).getTime() > now));
  const filtered = filterProperties(candidates, options);
  const limit = options.limit || 12;
  const offset = options.offset || 0;
  return { properties: filtered.slice(offset, offset + limit), total: filtered.length };
}

export type CardContact = { phone: string; label: string; note: string };

/**
 * Contact buttons for listing cards on the main site: a boosted agent listing
 * calls that agent; your own listings call the number in Plans & settings.
 */
export async function marketplaceContacts(properties: PropertyDoc[]): Promise<Record<string, CardContact>> {
  const site = await getSiteConfig();
  const agentIds = Array.from(new Set(properties.filter((p) => p.ownerType === "AGENT").map((p) => p.postedById)));
  const agents = agentIds.length ? await adminDb.getAll(...agentIds.map((id) => agentsCol().doc(id))) : [];
  const byId = new Map(agents.filter((a) => a.exists).map((a) => [a.id, a.data()!]));
  const out: Record<string, CardContact> = {};
  for (const p of properties) {
    if (p.ownerType === "AGENT") {
      const a = byId.get(p.postedById);
      if (a) out[p.id] = { phone: waNumber(a.whatsapp), label: "Agent", note: `Listed by ${a.displayName}` };
    } else if (site.brokerWhatsapp) {
      out[p.id] = { phone: waNumber(site.brokerWhatsapp), label: "Us", note: `Listed by ${BRAND.name}` };
    }
  }
  return out;
}

/** An agent's own listings. Bounded by their plan limit (max 100). */
export async function getOwnerProperties(uid: string, opts: { activeOnly?: boolean } = {}): Promise<PropertyDoc[]> {
  let query: FirebaseFirestore.Query = propertiesCol().where("postedById", "==", uid);
  if (opts.activeOnly) query = query.where("status", "==", PropertyStatus.ACTIVE);
  const snap = await query.orderBy("createdAt", "desc").limit(200).get();
  return snap.docs.map((d) => docToTyped<PropertyDoc>(d)!).map((p) => ({ ...p, media: p.media || [] }));
}

/** Listings that use a plan slot: live and hidden ones. Sold and rented ones don't. */
export async function countOwnerProperties(uid: string): Promise<number> {
  const agg = await propertiesCol()
    .where("postedById", "==", uid)
    .where("status", "in", [PropertyStatus.ACTIVE, PropertyStatus.INACTIVE, PropertyStatus.PENDING])
    .count()
    .get();
  return agg.data().count;
}

export async function createProperty(
  data: Omit<PropertyDoc, "id" | "createdAt" | "updatedAt" | "viewCount" | "isFeatured">,
  privateDetails?: PropertyPrivateDoc
): Promise<string> {
  const now = new Date();
  const ref = propertiesCol().doc();
  const batch = adminDb.batch();
  batch.set(ref, { ...data, isFeatured: false, viewCount: 0, createdAt: now, updatedAt: now });
  if (privateDetails) batch.set(ref.collection("private").doc("details"), privateDetails);
  await batch.commit();
  return ref.id;
}

export async function updateProperty(id: string, data: Partial<PropertyDoc>, privateDetails?: PropertyPrivateDoc): Promise<void> {
  const { id: _ignored, createdAt, ...rest } = data as any;
  const batch = adminDb.batch();
  batch.update(propertiesCol().doc(id), { ...rest, updatedAt: new Date() });
  if (privateDetails) batch.set(privateDetailsRef(id), privateDetails, { merge: true });
  await batch.commit();
}

export async function deleteProperty(id: string): Promise<void> {
  const batch = adminDb.batch();
  batch.delete(privateDetailsRef(id));
  batch.delete(propertiesCol().doc(id));
  await batch.commit();
}

export async function incrementViewCount(id: string): Promise<void> {
  await propertiesCol().doc(id).update({ viewCount: FieldValue.increment(1) });
}

// ─── Leads ──────────────────────────────────────────────────────────────────

export async function createLead(data: Omit<LeadDoc, "id" | "createdAt" | "updatedAt">): Promise<LeadDoc> {
  const now = new Date();
  const doc = { ...data, phoneKey: phoneKey(data.phone), createdAt: now, updatedAt: now };
  const ref = await leadsCol().add(doc);
  return { id: ref.id, ...doc };
}

/** An enquiry or client this owner already has with the same mobile number. */
export async function findLeadByPhone(ownerId: string, phone: string): Promise<LeadDoc | null> {
  const key = phoneKey(phone);
  if (!key) return null;
  const snap = await leadsCol().where("ownerId", "==", ownerId).where("phoneKey", "==", key).limit(1).get();
  return snap.empty ? null : docToTyped<LeadDoc>(snap.docs[0]);
}

export async function getLeadById(id: string): Promise<LeadDoc | null> {
  return docToTyped<LeadDoc>(await leadsCol().doc(id).get());
}

export async function getLeadsForOwner(uid: string, limit = 200): Promise<LeadDoc[]> {
  const snap = await leadsCol().where("ownerId", "==", uid).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => docToTyped<LeadDoc>(d)!);
}

/** Enquiries on the admin's own listings (the main site). */
export async function getAdminLeads(limit = 500): Promise<LeadDoc[]> {
  const snap = await leadsCol().where("ownerType", "==", "ADMIN").orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => docToTyped<LeadDoc>(d)!);
}

export async function updateLead(id: string, data: Partial<LeadDoc>): Promise<void> {
  await leadsCol().doc(id).update({ ...data, updatedAt: new Date() });
}

export async function getLeadNotes(leadId: string): Promise<LeadNoteDoc[]> {
  const snap = await leadNotesCol().where("leadId", "==", leadId).orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<LeadNoteDoc>(d)!);
}

export async function createLeadNote(data: Omit<LeadNoteDoc, "id" | "createdAt">): Promise<LeadNoteDoc> {
  const now = new Date();
  const ref = await leadNotesCol().add({ ...data, createdAt: now });
  return { id: ref.id, ...data, createdAt: now };
}

// ─── Payments ───────────────────────────────────────────────────────────────

export async function getPaymentRequests(filter: { agentId?: string; status?: string } = {}): Promise<PaymentRequestDoc[]> {
  let query: FirebaseFirestore.Query = paymentRequestsCol();
  if (filter.agentId) query = query.where("agentId", "==", filter.agentId);
  if (filter.status) query = query.where("status", "==", filter.status);
  const snap = await query.orderBy("createdAt", "desc").limit(300).get();
  return snap.docs.map((d) => docToTyped<PaymentRequestDoc>(d)!);
}

// ─── Audit ──────────────────────────────────────────────────────────────────

export async function writeAudit(actorId: string, action: string, target: string, detail: Record<string, unknown> = {}) {
  await auditLogCol().add({ actorId, action, target, detail, createdAt: new Date() });
}

// ─── Blog ───────────────────────────────────────────────────────────────────

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDoc | null> {
  const snap = await blogPostsCol().where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return docToTyped<BlogPostDoc>(snap.docs[0]);
}

export async function getPublishedBlogPosts(): Promise<BlogPostDoc[]> {
  const snap = await blogPostsCol().where("isPublished", "==", true).orderBy("publishedAt", "desc").get();
  return snap.docs.map((d) => docToTyped<BlogPostDoc>(d)!);
}

// ─── Rate Limits ────────────────────────────────────────────────────────────

export async function getRateLimit(key: string): Promise<RateLimitDoc | null> {
  return docToTyped<RateLimitDoc>(await rateLimitsCol().doc(key).get());
}

export async function upsertRateLimit(key: string, count: number, resetAt: Date): Promise<void> {
  await rateLimitsCol().doc(key).set({ key, count, resetAt }, { merge: true });
}

export async function incrementRateLimit(key: string, resetAt: Date): Promise<void> {
  await rateLimitsCol().doc(key).set({ key, count: FieldValue.increment(1), resetAt }, { merge: true });
}

export async function deleteRateLimit(key: string): Promise<void> {
  await rateLimitsCol().doc(key).delete();
}
