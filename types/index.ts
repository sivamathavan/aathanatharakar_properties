// TypeScript enums — replaces @prisma/client enums
// These mirror the exact values from the old Prisma schema

export enum UserRole {
  ADMIN = "ADMIN",
  AGENT = "AGENT",
  VENDOR = "VENDOR",
  PROPERTY_LISTER = "PROPERTY_LISTER",
}

export enum AccountStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum VendorCategory {
  BUILDER = "BUILDER",
  INTERIOR_DESIGNER = "INTERIOR_DESIGNER",
  PAINTER = "PAINTER",
  ELECTRICIAN = "ELECTRICIAN",
  PLUMBER = "PLUMBER",
  CARPENTER = "CARPENTER",
  ARCHITECT = "ARCHITECT",
  VASTU_CONSULTANT = "VASTU_CONSULTANT",
  HOME_LOAN_ADVISOR = "HOME_LOAN_ADVISOR",
  MOVERS_PACKERS = "MOVERS_PACKERS",
  TILES_FLOORING = "TILES_FLOORING",
  CIVIL_CONTRACTOR = "CIVIL_CONTRACTOR",
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
  WHATSAPP = "WHATSAPP",
  REFERRAL = "REFERRAL",
  DIRECT = "DIRECT",
}

export enum CommissionType {
  PROPERTY_SALE = "PROPERTY_SALE",
  PROPERTY_RENTAL = "PROPERTY_RENTAL",
  PROPERTY_LEASE = "PROPERTY_LEASE",
  BUILDER_REFERRAL = "BUILDER_REFERRAL",
  INTERIOR_REFERRAL = "INTERIOR_REFERRAL",
  PAINTER_REFERRAL = "PAINTER_REFERRAL",
  ELECTRICIAN_REFERRAL = "ELECTRICIAN_REFERRAL",
  HOME_LOAN_REFERRAL = "HOME_LOAN_REFERRAL",
  OTHER_SERVICE = "OTHER_SERVICE",
  PLATFORM_FEE = "PLATFORM_FEE",
}

export enum CommissionStatus {
  EXPECTED = "EXPECTED",
  RECEIVED = "RECEIVED",
  CANCELLED = "CANCELLED",
}

// ─── Firestore Document Types ────────────────────────────────────────────────

export interface UserDoc {
  id: string; // Firebase UID
  name: string;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password?: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentProfileDoc {
  id: string; // same as userId
  userId: string;
  fullName: string;
  mobile: string;
  reraNumber?: string | null;
  officeAddress: string;
  operatingCities: string[];
  experience: number;
  bio?: string | null;
  profilePhoto?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorProfileDoc {
  id: string; // same as userId
  userId: string;
  businessName: string;
  ownerName: string;
  mobile: string;
  email: string;
  category: VendorCategory;
  description: string;
  serviceAreas: string[];
  yearsInBusiness: number;
  projectsDone?: number | null;
  priceRangeMin?: number | null;
  priceRangeMax?: number | null;
  websiteUrl?: string | null;
  isVerified: boolean;
  isFeatured: boolean;
  rating?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaDoc {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  publicId: string;
  type: MediaType;
  caption?: string | null;
  order: number;
  createdAt: Date;
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
  amenities: string[];
  isFeatured: boolean;
  status: PropertyStatus;
  viewCount: number;
  postedById: string;
  createdAt: Date;
  updatedAt: Date;
  media?: MediaDoc[];
}

export interface LeadDoc {
  id: string;
  propertyId?: string | null;
  name: string;
  email: string;
  message: string;
  status: LeadStatus;
  assignedToId?: string | null;
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

export interface VendorEnquiryDoc {
  id: string;
  vendorId: string;
  name: string;
  email: string;
  message: string;
  status: LeadStatus;
  createdAt: Date;
}

export interface CommissionDoc {
  id: string;
  leadId?: string | null;
  propertyId?: string | null;
  type: CommissionType;
  amount: number;
  status: CommissionStatus;
  notes?: string | null;
  dueDate?: Date | null;
  receivedDate?: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface BlogPostDoc {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImageUrl?: string | null;
  coverPublicId?: string | null;
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

export interface VerificationTokenDoc {
  identifier: string;
  token: string;
  expires: Date;
}
