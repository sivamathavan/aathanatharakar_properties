// The agent's own buyers (clients looking for a property). Server only.
import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { docToTyped } from "@/lib/firestore";
import { AgentBuyerDoc, PropertyType } from "@/types";

export const agentBuyersCol = () => adminDb.collection("agentBuyers");

const money = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Math.round(Number(v))))
  .refine((v) => v === null || (Number.isFinite(v) && v >= 0), "Enter the budget in rupees");

export const buyerInputSchema = z
  .object({
    name: z.string().trim().min(2, "Enter the buyer's name").max(120),
    phone: z.string().trim().max(20).refine((v) => v.replace(/[^0-9]/g, "").length >= 10, "Enter a valid phone number"),
    listingType: z.enum(["BUY", "RENT"]),
    types: z.array(z.nativeEnum(PropertyType)).max(8).default([]),
    city: z.string().trim().max(80).optional().nullable().transform((v) => v || null),
    localities: z.array(z.string().trim().max(60)).max(10).default([]).transform((l) => l.filter(Boolean)),
    budgetMin: money,
    budgetMax: money,
    bedrooms: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === "" || v === null || v === undefined ? null : Number(v))).refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 20), "Bedrooms must be a number"),
    notes: z.string().trim().max(1000).optional().nullable().transform((v) => v || null),
    status: z.enum(["ACTIVE", "CLOSED"]).default("ACTIVE"),
    leadId: z.string().max(128).optional().nullable().transform((v) => v || null),
  })
  .refine((b) => !b.budgetMin || !b.budgetMax || b.budgetMin <= b.budgetMax, { message: "Minimum budget is more than the maximum", path: ["budgetMin"] });

export type BuyerInput = z.infer<typeof buyerInputSchema>;

export async function getBuyersForOwner(ownerId: string): Promise<AgentBuyerDoc[]> {
  const snap = await agentBuyersCol().where("ownerId", "==", ownerId).orderBy("createdAt", "desc").limit(500).get();
  return snap.docs.map((d) => docToTyped<AgentBuyerDoc>(d)!);
}

export async function getOwnBuyer(id: string, ownerId: string): Promise<AgentBuyerDoc | null> {
  const buyer = docToTyped<AgentBuyerDoc>(await agentBuyersCol().doc(id).get());
  return buyer && buyer.ownerId === ownerId ? buyer : null;
}
