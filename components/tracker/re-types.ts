// ═══════════════════════════════════════
// Tracker — Types & Constants
// ═══════════════════════════════════════
import { DOC_ITEMS } from "@/lib/doc-items";

export const RE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'people', label: 'People & Network' },
  { key: 'deals', label: 'Deals' },
  { key: 'properties', label: 'Properties' },
  { key: 'match', label: 'Buyer Match' },
  { key: 'commission', label: 'Commission' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'expenses', label: 'Expenses' },
] as const;

export type ReTabKey = (typeof RE_TABS)[number]['key'];

export const RE_PERSON_TYPES = [
  'Buyer', 'Broker', 'Land Owner', 'Builder', 'Interior Designer',
  'Architect', 'Lawyer', 'Financial Agent', 'Vendor', 'Other',
] as const;
export type RePersonType = (typeof RE_PERSON_TYPES)[number];

export const RE_DEAL_TYPES = [
  'Both Side Broker', 'Buyer Side Only', 'Seller Side Only',
  'Direct Deal', 'Chain Broker', 'Referral',
] as const;
export type ReDealType = (typeof RE_DEAL_TYPES)[number];

export const RE_DEAL_STATUSES = [
  'New Lead', 'Site Visit Done', 'Negotiation', 'Token Paid',
  'Agreement Signed', 'Registration Done', 'Completed', 'Dropped',
] as const;
export type ReDealStatus = (typeof RE_DEAL_STATUSES)[number];

// Same property types as the website, so a buyer can be matched to any listing.
export const RE_PROPERTY_TYPES = [
  'Plot', 'Farm Land', 'Commercial', 'Apartment', 'Villa', 'House', 'Warehouse', 'PG / Hostel',
] as const;
export type RePropertyType = (typeof RE_PROPERTY_TYPES)[number];

export const RE_PROPERTY_STATUSES = ['Available', 'Under Deal', 'Sold', 'Off Market'] as const;
export type RePropertyStatus = (typeof RE_PROPERTY_STATUSES)[number];

export const RE_DOC_ITEMS = DOC_ITEMS;

export const RE_COMMISSION_PILLS = [
  'Calculator', 'Deal Records', 'Money In', 'Payouts', 'Net Summary',
] as const;
export type ReCommPill = (typeof RE_COMMISSION_PILLS)[number];

export const TN_DISTRICTS = [
  'Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore',
  'Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram',
  'Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam',
  'Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram',
  'Ranipet','Salem','Sivagangai','Tenkasi','Thanjavur',
  'Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur',
  'Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore',
  'Viluppuram','Virudhunagar','Kanniyakumari',
] as const;

// ── Interfaces ──────────────────────────

export interface RePerson {
  id: string;
  name: string;
  person_type: RePersonType;
  mobile: string;
  email: string;
  district: string;
  area: string;
  company: string;
  rera_id: string;
  commission_giver: boolean;
  commission_rate: number;
  total_commission: number;
  status: 'Active' | 'Inactive';
  pinned: boolean;
  notes: string;
  specialization: string;
  buyer_budget?: number | null;
  buyer_property_type?: RePropertyType | 'Any' | null;
  created_at: string;
}

export interface ReDeal {
  id: string;
  title: string;
  deal_type: ReDealType;
  status: ReDealStatus;
  property_type: RePropertyType;
  district: string;
  area: string;
  property_value: number;
  seller_name: string;
  seller_mobile: string;
  buyer_name: string;
  buyer_mobile: string;
  seller_broker_id: string;
  buyer_broker_id: string;
  commission_rate_seller: number;
  commission_rate_buyer: number;
  commission_amount: number; // worked out by the server from value and rates
  commission_received: number; // from the ledger (Money In, received)
  token_amount: number;
  follow_up_date: string;
  notes: string;
  documents: string[];
  property_id?: string;
  lead_id?: string;
  created_at: string;
}

/** One of the admin's own listings, seen from the back office. */
export interface ReProperty {
  id: string;
  title: string;
  property_type: RePropertyType | string;
  status: RePropertyStatus;
  on_website: boolean;
  district: string;
  area: string;
  city: string;
  extent: string;
  road_facing: string;
  price: number;
  owner_name: string;
  owner_mobile: string;
  submitter_name: string;
  submitter_mobile: string;
  survey_number: string;
  maps_link: string;
  doc_checklist: Record<string, 'Pending' | 'Received' | 'Verified'>;
  doc_files: Record<string, string>;
  photos: string[];
  notes: string;
  view_count: number;
  created_at: string;
}

/** Money in (commission received) or out (paid to co-brokers and partners). */
export interface ReLedgerEntry {
  id: string;
  direction: 'IN' | 'OUT';
  deal_id: string;
  deal_title: string;
  person_id: string;
  person_name: string;
  amount: number;
  settled: boolean;
  tds_deducted: boolean;
  date: string;
  mode: string;
  notes: string;
  created_at: string;
}

export interface ReExpense {
  id: string;
  expense_type: 'EXPENSE' | 'INVESTMENT' | 'DRAWING';
  category: string;
  amount: number;
  spent_by: string;
  description: string;
  date: string;
  payment_mode: string;
  notes: string;
  created_at: string;
}

export interface ReActivity {
  id: string;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
}

export function re_id(): string {
  return `re_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
