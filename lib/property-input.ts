// Validation and shaping for property create/update requests (server-side).
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { ListingType, PriceUnit, PropertyPrivateDoc, PropertyType } from "@/types";

export { DOC_ITEMS } from "@/lib/doc-items";

const optionalNumber = z
  .union([z.number(), z.string()])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null || v === undefined ? null : Number(v)))
  .refine((v) => v === null || Number.isFinite(v), "Invalid number");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const mediaSchema = z.object({
  url: z.string().url(),
  type: z.enum(["IMAGE", "VIDEO"]),
  path: z.string().max(300).optional().nullable(),
});

export const propertyInputSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(160),
  description: z.string().trim().min(10, "Add a short description").max(5000),
  type: z.nativeEnum(PropertyType),
  listingType: z.nativeEnum(ListingType),
  price: z.coerce.number().min(0, "Price can't be negative"),
  priceUnit: z.nativeEnum(PriceUnit).default(PriceUnit.TOTAL),
  area: z.coerce.number().positive("Enter the area"),
  areaUnit: z.enum(["SQFT", "CENT", "ACRE", "GROUND"]).default("SQFT"),
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  address: z.string().trim().min(3, "Add the address").max(500),
  locality: z.string().trim().min(2, "Add the locality").max(120),
  city: z.string().trim().min(2, "Choose the city").max(80),
  district: optionalText(80),
  pincode: optionalText(10),
  latitude: optionalNumber,
  longitude: optionalNumber,
  roadFacing: optionalText(80),
  mapsLink: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\//.test(v), "Maps link must start with https://"),
  amenities: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  media: z.array(mediaSchema).max(30).optional().default([]),
  // Private: only the owner and admin ever see these.
  ownerName: optionalText(120),
  ownerPhone: optionalText(20),
  surveyNumber: optionalText(60),
  privateNotes: optionalText(2000),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;

export function publicFields(input: PropertyInput) {
  return {
    title: input.title,
    description: input.description,
    type: input.type,
    listingType: input.listingType,
    price: Math.round(input.price),
    priceUnit: input.priceUnit,
    area: input.area,
    areaUnit: input.areaUnit,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    address: input.address,
    locality: input.locality,
    city: input.city,
    district: input.district || input.city,
    pincode: input.pincode,
    latitude: input.latitude,
    longitude: input.longitude,
    roadFacing: input.roadFacing,
    mapsLink: input.mapsLink,
    amenities: input.amenities,
    media: input.media.map((m) => ({ url: m.url, type: m.type, path: m.path || null })),
  };
}

export function privateFields(input: PropertyInput): PropertyPrivateDoc {
  return {
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone,
    surveyNumber: input.surveyNumber,
    notes: input.privateNotes,
  };
}

/** Media must live in the uploader's own storage folder (or the bucket's public URL of it). */
export function mediaBelongsTo(media: { url: string; path?: string | null }[], uid: string): boolean {
  const encoded = encodeURIComponent(`properties/${uid}/`);
  return media.every((m) => (m.path ? m.path.startsWith(`properties/${uid}/`) : m.url.includes(encoded)));
}

/** Refresh cached public pages after a listing changes. */
export function refreshListingCaches(agentSlug?: string | null, propertyId?: string) {
  revalidateTag("properties");
  revalidatePath("/");
  revalidatePath("/properties");
  if (propertyId) revalidatePath(`/properties/${propertyId}`);
  if (agentSlug) {
    revalidatePath(`/a/${agentSlug}`);
    if (propertyId) revalidatePath(`/a/${agentSlug}/${propertyId}`);
  }
}
