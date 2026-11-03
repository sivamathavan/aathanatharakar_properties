// Form values for the property form, and turning a stored listing into them.
// Kept out of the "use client" form file so server pages can call toFormValues
// (a function exported from a client file can't be called on the server).
import type { UploadedMedia } from "@/components/ui/FirebaseUpload";

export interface PropertyFormValues {
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: string;
  priceUnit: string;
  area: string;
  areaUnit: string;
  bedrooms: string;
  bathrooms: string;
  city: string;
  locality: string;
  address: string;
  pincode: string;
  roadFacing: string;
  mapsLink: string;
  amenities: string;
  media: UploadedMedia[];
  ownerName: string;
  ownerPhone: string;
  surveyNumber: string;
  privateNotes: string;
}

export const EMPTY_PROPERTY: PropertyFormValues = {
  title: "",
  description: "",
  type: "",
  listingType: "BUY",
  price: "",
  priceUnit: "TOTAL",
  area: "",
  areaUnit: "SQFT",
  bedrooms: "",
  bathrooms: "",
  city: "",
  locality: "",
  address: "",
  pincode: "",
  roadFacing: "",
  mapsLink: "",
  amenities: "",
  media: [],
  ownerName: "",
  ownerPhone: "",
  surveyNumber: "",
  privateNotes: "",
};

/** Shape a stored property (+ private details) into form values. */
export function toFormValues(p: any, priv: any = {}): PropertyFormValues {
  const s = (x: unknown) => (x === null || x === undefined ? "" : String(x));
  return {
    title: s(p.title),
    description: s(p.description),
    type: s(p.type),
    listingType: s(p.listingType) === "SELL" ? "BUY" : s(p.listingType) || "BUY",
    price: s(p.price),
    priceUnit: s(p.priceUnit) || "TOTAL",
    area: s(p.area),
    areaUnit: s(p.areaUnit) || "SQFT",
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    city: s(p.city),
    locality: s(p.locality),
    address: s(p.address),
    pincode: s(p.pincode),
    roadFacing: s(p.roadFacing),
    mapsLink: s(p.mapsLink),
    amenities: (p.amenities || []).join(", "),
    media: (p.media || []).map((m: any) => ({ url: m.url, type: m.type, path: m.path || null })),
    ownerName: s(priv.ownerName),
    ownerPhone: s(priv.ownerPhone),
    surveyNumber: s(priv.surveyNumber),
    privateNotes: s(priv.notes),
  };
}
