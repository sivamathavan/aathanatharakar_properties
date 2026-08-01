// Firestore collection helpers and CRUD functions
// Server-side: uses firebase-admin. Client-side: uses firebase client SDK.
import { adminDb } from "@/lib/firebase-admin";
import {
  PropertyDoc,
  PropertyStatus,
  UserDoc,
  UserRole,
  AccountStatus,
  LeadDoc,
  LeadStatus,
  LeadSource,
  LeadNoteDoc,
  VendorProfileDoc,
  VendorEnquiryDoc,
  CommissionDoc,
  BlogPostDoc,
  AgentProfileDoc,
  MediaDoc,
  RateLimitDoc,
  VerificationTokenDoc,
} from "@/types";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// ─── Collection References ──────────────────────────────────────────────────

export const usersCol = () => adminDb.collection("users");
export const agentProfilesCol = () => adminDb.collection("agentProfiles");
export const vendorProfilesCol = () => adminDb.collection("vendorProfiles");
export const propertiesCol = () => adminDb.collection("properties");
export const leadsCol = () => adminDb.collection("leads");
export const leadNotesCol = () => adminDb.collection("leadNotes");
export const vendorEnquiriesCol = () => adminDb.collection("vendorEnquiries");
export const commissionsCol = () => adminDb.collection("commissions");
export const blogPostsCol = () => adminDb.collection("blogPosts");
export const rateLimitsCol = () => adminDb.collection("rateLimits");
export const verificationTokensCol = () => adminDb.collection("verificationTokens");

// ─── Firestore Timestamp Helpers ────────────────────────────────────────────

function toDate(val: any): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return new Date();
}

function docToTyped<T>(doc: FirebaseFirestore.DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  // Convert all Timestamp fields to Date
  const converted: any = { id: doc.id };
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate();
    } else {
      converted[key] = value;
    }
  }
  return converted as T;
}

// ─── User Operations ────────────────────────────────────────────────────────

export async function getUserById(uid: string): Promise<UserDoc | null> {
  const doc = await usersCol().doc(uid).get();
  return docToTyped<UserDoc>(doc);
}

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  const snap = await usersCol().where("email", "==", email.toLowerCase().trim()).limit(1).get();
  if (snap.empty) return null;
  return docToTyped<UserDoc>(snap.docs[0]);
}

export async function createUser(uid: string, data: Omit<UserDoc, "id" | "createdAt" | "updatedAt">): Promise<UserDoc> {
  const now = new Date();
  const doc = { ...data, createdAt: now, updatedAt: now };
  await usersCol().doc(uid).set(doc);
  return { id: uid, ...doc };
}

export async function updateUser(uid: string, data: Partial<UserDoc>): Promise<void> {
  await usersCol().doc(uid).update({ ...data, updatedAt: new Date() });
}

export async function getAllUsers(): Promise<UserDoc[]> {
  const snap = await usersCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<UserDoc>(d)!);
}

// ─── Property Operations ────────────────────────────────────────────────────

export async function getPropertyById(id: string): Promise<PropertyDoc | null> {
  const doc = await propertiesCol().doc(id).get();
  const property = docToTyped<PropertyDoc>(doc);
  if (!property) return null;

  // Fetch subcollection media
  const mediaSnap = await propertiesCol().doc(id).collection("media").orderBy("order").get();
  property.media = mediaSnap.docs.map((m) => docToTyped<MediaDoc>(m)!);
  return property;
}

export async function getActiveProperties(options?: {
  limit?: number;
  featured?: boolean;
  type?: string;
  city?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  offset?: number;
  listingType?: string;
  sort?: string;
}): Promise<{ properties: PropertyDoc[]; total: number }> {
  let query: FirebaseFirestore.Query = propertiesCol()
    .where("status", "==", PropertyStatus.ACTIVE);

  if (options?.featured) {
    query = query.where("isFeatured", "==", true);
  }
  if (options?.type) {
    query = query.where("type", "==", options.type);
  }
  if (options?.city) {
    query = query.where("city", "==", options.city);
  }
  if (options?.bedrooms) {
    query = query.where("bedrooms", "==", options.bedrooms);
  }
  if (options?.listingType) {
    query = query.where("listingType", "==", options.listingType);
  }

  // Get total records matching query
  const allSnap = await query.get();
  let docs = allSnap.docs;

  // Client-side filters for text search and price range
  if (options?.search) {
    const searchLower = options.search.toLowerCase();
    docs = docs.filter((d) => {
      const data = d.data();
      return (
        data.title?.toLowerCase().includes(searchLower) ||
        data.locality?.toLowerCase().includes(searchLower) ||
        data.address?.toLowerCase().includes(searchLower) ||
        data.description?.toLowerCase().includes(searchLower)
      );
    });
  }
  if (options?.minPrice !== undefined) {
    docs = docs.filter((d) => d.data().price >= options.minPrice!);
  }
  if (options?.maxPrice !== undefined) {
    docs = docs.filter((d) => d.data().price <= options.maxPrice!);
  }

  // Apply sorting
  if (options?.sort === "price_asc") {
    docs.sort((a, b) => Number(a.data().price || 0) - Number(b.data().price || 0));
  } else if (options?.sort === "price_desc") {
    docs.sort((a, b) => Number(b.data().price || 0) - Number(a.data().price || 0));
  } else {
    // default / newest (createdAt desc)
    docs.sort((a, b) => {
      const timeA = a.data().createdAt?.seconds ? a.data().createdAt.seconds * 1000 : new Date(a.data().createdAt || 0).getTime();
      const timeB = b.data().createdAt?.seconds ? b.data().createdAt.seconds * 1000 : new Date(b.data().createdAt || 0).getTime();
      return timeB - timeA;
    });
  }

  const total = docs.length;

  // Apply pagination
  const limit = options?.limit || 12;
  const offset = options?.offset || 0;
  const paginatedDocs = docs.slice(offset, offset + limit);

  const properties: PropertyDoc[] = [];
  for (const d of paginatedDocs) {
    const prop = docToTyped<PropertyDoc>(d)!;
    // Fetch media subcollection
    const mediaSnap = await propertiesCol().doc(d.id).collection("media").orderBy("order").get();
    prop.media = mediaSnap.docs.map((m) => docToTyped<MediaDoc>(m)!);
    properties.push(prop);
  }

  return { properties, total };
}

export async function createProperty(data: Omit<PropertyDoc, "id" | "createdAt" | "updatedAt" | "viewCount" | "isFeatured">, media: Omit<MediaDoc, "id" | "createdAt">[]): Promise<PropertyDoc> {
  const now = new Date();
  const { ...propData } = data;
  const docRef = await propertiesCol().add({
    ...propData,
    isFeatured: false,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  // Add media as subcollection
  for (const m of media) {
    await docRef.collection("media").add({
      ...m,
      createdAt: now,
    });
  }

  return { id: docRef.id, ...propData, isFeatured: false, viewCount: 0, createdAt: now, updatedAt: now, media: [] };
}

export async function updateProperty(id: string, data: Partial<PropertyDoc>): Promise<void> {
  const { media, ...rest } = data as any;
  await propertiesCol().doc(id).update({ ...rest, updatedAt: new Date() });
}

export async function deleteProperty(id: string): Promise<void> {
  // Delete media subcollection first
  const mediaSnap = await propertiesCol().doc(id).collection("media").get();
  const batch = adminDb.batch();
  mediaSnap.docs.forEach((doc) => batch.delete(doc.ref));
  batch.delete(propertiesCol().doc(id));
  await batch.commit();
}

export async function incrementViewCount(id: string): Promise<void> {
  await propertiesCol().doc(id).update({
    viewCount: FieldValue.increment(1),
  });
}

// ─── Lead Operations ────────────────────────────────────────────────────────

export async function createLead(data: Omit<LeadDoc, "id" | "createdAt" | "updatedAt">): Promise<LeadDoc> {
  const now = new Date();
  const docRef = await leadsCol().add({ ...data, createdAt: now, updatedAt: now });
  return { id: docRef.id, ...data, createdAt: now, updatedAt: now };
}

export async function getLeadById(id: string): Promise<LeadDoc | null> {
  const doc = await leadsCol().doc(id).get();
  return docToTyped<LeadDoc>(doc);
}

export async function getAllLeads(): Promise<LeadDoc[]> {
  const snap = await leadsCol().orderBy("createdAt", "desc").get();
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
  const docRef = await leadNotesCol().add({ ...data, createdAt: now });
  return { id: docRef.id, ...data, createdAt: now };
}

// ─── Vendor Operations ──────────────────────────────────────────────────────

export async function getVendorProfileById(id: string): Promise<VendorProfileDoc | null> {
  const doc = await vendorProfilesCol().doc(id).get();
  return docToTyped<VendorProfileDoc>(doc);
}

export async function getVendorProfileByUserId(userId: string): Promise<VendorProfileDoc | null> {
  const snap = await vendorProfilesCol().where("userId", "==", userId).limit(1).get();
  if (snap.empty) return null;
  return docToTyped<VendorProfileDoc>(snap.docs[0]);
}

export async function getAllVendorProfiles(): Promise<VendorProfileDoc[]> {
  const snap = await vendorProfilesCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<VendorProfileDoc>(d)!);
}

export async function createVendorEnquiry(data: Omit<VendorEnquiryDoc, "id" | "createdAt">): Promise<VendorEnquiryDoc> {
  const now = new Date();
  const docRef = await vendorEnquiriesCol().add({ ...data, createdAt: now });
  return { id: docRef.id, ...data, createdAt: now };
}

export async function getAllVendorEnquiries(): Promise<VendorEnquiryDoc[]> {
  const snap = await vendorEnquiriesCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<VendorEnquiryDoc>(d)!);
}

// ─── Agent Operations ───────────────────────────────────────────────────────

export async function getAgentProfileByUserId(userId: string): Promise<AgentProfileDoc | null> {
  const snap = await agentProfilesCol().where("userId", "==", userId).limit(1).get();
  if (snap.empty) return null;
  return docToTyped<AgentProfileDoc>(snap.docs[0]);
}

// ─── Commission Operations ──────────────────────────────────────────────────

export async function getAllCommissions(): Promise<CommissionDoc[]> {
  const snap = await commissionsCol().orderBy("createdAt", "desc").get();
  return snap.docs.map((d) => docToTyped<CommissionDoc>(d)!);
}

export async function createCommission(data: Omit<CommissionDoc, "id" | "createdAt">): Promise<CommissionDoc> {
  const now = new Date();
  const docRef = await commissionsCol().add({ ...data, createdAt: now });
  return { id: docRef.id, ...data, createdAt: now };
}

export async function updateCommission(id: string, data: Partial<CommissionDoc>): Promise<void> {
  await commissionsCol().doc(id).update(data);
}

// ─── Blog Operations ────────────────────────────────────────────────────────

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDoc | null> {
  const snap = await blogPostsCol().where("slug", "==", slug).limit(1).get();
  if (snap.empty) return null;
  return docToTyped<BlogPostDoc>(snap.docs[0]);
}

export async function getPublishedBlogPosts(): Promise<BlogPostDoc[]> {
  const snap = await blogPostsCol()
    .where("isPublished", "==", true)
    .orderBy("publishedAt", "desc")
    .get();
  return snap.docs.map((d) => docToTyped<BlogPostDoc>(d)!);
}

// ─── Rate Limit Operations ──────────────────────────────────────────────────

export async function getRateLimit(key: string): Promise<RateLimitDoc | null> {
  const doc = await rateLimitsCol().doc(key).get();
  return docToTyped<RateLimitDoc>(doc);
}

export async function upsertRateLimit(key: string, count: number, resetAt: Date): Promise<void> {
  await rateLimitsCol().doc(key).set({ key, count, resetAt }, { merge: true });
}

export async function incrementRateLimit(key: string, resetAt: Date): Promise<void> {
  const doc = await rateLimitsCol().doc(key).get();
  if (doc.exists) {
    await rateLimitsCol().doc(key).update({
      count: FieldValue.increment(1),
      resetAt,
    });
  } else {
    await rateLimitsCol().doc(key).set({ key, count: 1, resetAt });
  }
}

export async function deleteRateLimit(key: string): Promise<void> {
  await rateLimitsCol().doc(key).delete();
}

// ─── Verification Token Operations ──────────────────────────────────────────

export async function createVerificationToken(data: VerificationTokenDoc): Promise<void> {
  await verificationTokensCol().add(data);
}

export async function findVerificationToken(identifier: string, token: string): Promise<VerificationTokenDoc | null> {
  const snap = await verificationTokensCol()
    .where("identifier", "==", identifier)
    .where("token", "==", token)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return docToTyped<VerificationTokenDoc>(snap.docs[0]);
}

export async function deleteVerificationTokens(identifier: string, token: string): Promise<void> {
  const snap = await verificationTokensCol()
    .where("identifier", "==", identifier)
    .where("token", "==", token)
    .get();
  const batch = adminDb.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
