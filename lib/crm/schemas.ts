// What the tracker API accepts for each collection. Anything not listed is dropped.
import { z } from "zod";

const str = (max = 200) => z.string().trim().max(max).optional().nullable().transform((v) => v ?? "");
const num = z.coerce.number().finite().min(0).optional().nullable().transform((v) => v ?? 0);
const optNum = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Invalid number");
const date = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v) => (v ? v.slice(0, 10) : ""))
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Invalid date");

export const CRM_SCHEMAS = {
  people: z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    person_type: str(40),
    mobile: str(20),
    email: str(160),
    district: str(60),
    area: str(120),
    company: str(120),
    rera_id: str(60),
    commission_giver: z.boolean().optional().default(false),
    commission_rate: num,
    total_commission: num,
    status: z.enum(["Active", "Inactive"]).optional().default("Active"),
    pinned: z.boolean().optional().default(false),
    notes: str(2000),
    specialization: str(120),
    buyer_budget: optNum,
    buyer_property_type: z.string().trim().max(40).optional().nullable().transform((v) => (v && v !== "Any" ? v : null)),
  }),
  deals: z.object({
    title: z.string().trim().min(1, "Deal title is required").max(200),
    deal_type: str(40),
    status: str(40),
    property_type: str(40),
    district: str(60),
    area: str(120),
    property_value: num,
    seller_name: str(120),
    seller_mobile: str(20),
    buyer_name: str(120),
    buyer_mobile: str(20),
    seller_broker_id: str(60),
    buyer_broker_id: str(60),
    commission_rate_seller: z.coerce.number().min(0).max(100).optional().default(0),
    commission_rate_buyer: z.coerce.number().min(0).max(100).optional().default(0),
    token_amount: num,
    follow_up_date: date,
    notes: str(4000),
    documents: z.array(z.string().max(500)).max(50).optional().default([]),
    property_id: str(60),
    lead_id: str(60),
  }),
  ledger: z.object({
    direction: z.enum(["IN", "OUT"]),
    deal_id: str(60),
    deal_title: str(200),
    person_id: str(60),
    person_name: z.string().trim().min(1, "Who is this from / to?").max(120),
    amount: z.coerce.number().positive("Enter an amount"),
    settled: z.boolean().optional().default(false),
    tds_deducted: z.boolean().optional().default(false),
    date,
    mode: str(30),
    notes: str(1000),
  }),
  expenses: z.object({
    expense_type: z.enum(["EXPENSE", "INVESTMENT", "DRAWING"]).optional().default("EXPENSE"),
    category: z.string().trim().min(1, "Choose a category").max(60),
    amount: z.coerce.number().positive("Enter an amount"),
    spent_by: str(120),
    description: str(500),
    date,
    payment_mode: str(30),
    notes: str(1000),
  }),
  activity: z.object({
    action: z.string().trim().min(1).max(120),
    entity: str(200),
    entity_id: str(60),
  }),
} as const;

export type CrmCollection = keyof typeof CRM_SCHEMAS;
export const CRM_COLLECTIONS = Object.keys(CRM_SCHEMAS) as CrmCollection[];
export const crmCollectionName = (c: CrmCollection) => `crm_${c}`;
