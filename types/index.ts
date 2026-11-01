// Shared enums and Firestore document shapes.

export enum UserRole {
  ADMIN = "ADMIN",
  AGENT = "AGENT",
}

export enum AccountStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum PropertyType {
  APARTMENT = "APARTMENT",
  VILLA = "VILLA",
  HOUSE = "HOUSE",
  PLOT = "PLOT",
  COMMERCIAL = "COMMERCIAL",
  WAREHOUSE = "WAREHOUSE",
  FARM_LAND = "FARM_LAND",
  PG_HOSTEL = "PG_HOSTEL",
}

export enum ListingType {
  BUY = "BUY",
  SELL = "SELL",
  RENT = "RENT",
  LEASE = "LEASE",
}

export enum PriceUnit {
  TOTAL = "TOTAL",
  PER_SQFT = "PER_SQFT",
  PER_MONTH = "PER_MONTH",
  PER_YEAR = "PER_YEAR",
}

// INACTIVE doubles as "draft / not on the website" for admin inventory.
export enum PropertyStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  RENTED = "RENTED",
  REJECTED = "REJECTED",
  INACTIVE = "INACTIVE",
}

export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  SITE_VISIT = "SITE_VISIT",
  NEGOTIATION = "NEGOTIATION",
  CLOSED = "CLOSED",
  LOST = "LOST",
}

export enum LeadSource {
  WEB = "WEB",
  AGENT_PAGE = "AGENT_PAGE",
  WHATSAPP = "WHATSAPP",
  REFERRAL = "REFERRAL",
  DIRECT = "DIRECT",
}

export type OwnerType = "ADMIN" | "AGENT";

// ─── Plans ───────────────────────────────────────────────────────────────────

export type PlanId = "TRIAL" | "STARTER" | "PRO";
export type PlanStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
export type BillingPeriod = "MONTHLY" | "YEARLY";

export interface PlanDef {
  id: PlanId;
  name: string;
  priceMonthly: number; // rupees
  priceYearly: number; // rupees
  listingLimit: number;
  photoLimit: number;
  branding: boolean; // logo + cover on share page
  viewStats: boolean;
  verifiedBadge: boolean;
  aiDraftsPerMonth: number; // "speak or paste your listing" uses
}

export interface PlansConfig {
  trialDays: number;
  boostPricePerWeek: number;
  plans: Record<PlanId, PlanDef>;
}

export interface SiteConfig {
  upiId: string;
  upiName: string;
  brokerWhatsapp: string;
  gstin: string;
}

export interface AgentPlan {
  id: PlanId;
  status: PlanStatus;
  expiresAt: Date;
  period?: BillingPeriod | null;
  previousStatus?: PlanStatus | null; // kept while suspended
}

// ─── Firestore documents ─────────────────────────────────────────────────────

export interface UserDoc {
  id: string; // Firebase UID
  name: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentDoc {
  id: string; // same as uid
  slug: string;
  displayName: string;
  agencyName?: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  bio?: string | null;
  reraNumber?: string | null;
  photoUrl?: string | null;
  logoUrl?: string | null;
  emailVerified: boolean;
  plan: AgentPlan;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  url: string;
  type: "IMAGE" | "VIDEO";
  path?: string | null; // storage path, for deletes
}

export interface PropertyDoc {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  listingType: ListingType;
  price: number;
  priceUnit: PriceUnit;
  area: number;
  areaUnit?: string | null; // SQFT, CENT, ACRE, GROUND
  bedrooms?: number | null;
  bathrooms?: number | null;
  floors?: number | null;
  address: string;
  locality: string;
  city: string;
  district: string;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  roadFacing?: string | null;
  mapsLink?: string | null;
  amenities: string[];
  media: MediaItem[];
  isFeatured: boolean;
  status: PropertyStatus;
  viewCount: number;
  postedById: string; // owner uid (admin or agent)
  ownerType: OwnerType;
  agentSlug?: string | null;
  onMarketplace: boolean; // shown on the main site (home page and search)
  boostUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DocStatus = "PENDING" | "RECEIVED" | "VERIFIED";

export interface PropertyPrivateDoc {
  ownerName?: string | null;
  ownerPhone?: string | null;
  surveyNumber?: string | null;
  notes?: string | null;
  sourceName?: string | null; // who brought the listing
  sourcePhone?: string | null;
  docChecklist?: Record<string, { status: DocStatus; fileUrl?: string | null; filePath?: string | null }>;
}

export interface LeadDoc {
  id: string;
  propertyId?: string | null;
  propertyTitle?: string | null;
  ownerId: string;
  ownerType: OwnerType;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  status: LeadStatus;
  source: LeadSource;
  siteVisitDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadNoteDoc {
  id: string;
  leadId: string;
  note: string;
  createdAt: Date;
}

export type PaymentKind = "PLAN" | "BOOST";
export type PaymentRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaymentRequestDoc {
  id: string;
  agentId: string;
  agentName: string;
  kind: PaymentKind;
  planId?: PlanId | null;
  period?: BillingPeriod | null;
  propertyId?: string | null;
  propertyTitle?: string | null;
  weeks?: number | null;
  amount: number;
  utr: string;
  status: PaymentRequestStatus;
  decidedBy?: string | null;
  decidedAt?: Date | null;
  note?: string | null;
  createdAt: Date;
}

export interface BlogPostDoc {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string | null;
  tags: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  authorId: string;
  isPublished: boolean;
  publishedAt?: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitDoc {
  key: string;
  count: number;
  resetAt: Date;
}
