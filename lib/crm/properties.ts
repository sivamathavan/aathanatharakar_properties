// The tracker's property inventory is the admin's own listings (one record per
// property). This maps them to the shape the tracker screens use.
import { adminDb } from "@/lib/firebase-admin";
import { docToTyped, privateDetailsRef, propertiesCol } from "@/lib/firestore";
import { DOC_ITEMS } from "@/lib/doc-items";
import type { PropertyDoc, PropertyPrivateDoc } from "@/types";

export const TYPE_LABEL: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  HOUSE: "House",
  PLOT: "Plot",
  COMMERCIAL: "Commercial",
  WAREHOUSE: "Warehouse",
  FARM_LAND: "Farm Land",
  PG_HOSTEL: "PG / Hostel",
};
const UNIT_LABEL: Record<string, string> = { SQFT: "sq.ft", CENT: "cents", ACRE: "acres", GROUND: "grounds" };
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Available", PENDING: "Available", INACTIVE: "Off Market", SOLD: "Sold", RENTED: "Sold", REJECTED: "Off Market" };
const DOC_LABEL = { PENDING: "Pending", RECEIVED: "Received", VERIFIED: "Verified" } as const;

export function toTrackerProperty(p: PropertyDoc, priv: PropertyPrivateDoc) {
  const checklist: Record<string, string> = {};
  const files: Record<string, string> = {};
  for (const item of DOC_ITEMS) {
    const entry = priv.docChecklist?.[item];
    checklist[item] = DOC_LABEL[entry?.status || "PENDING"];
    if (entry?.filePath) files[item] = entry.filePath;
  }
  return {
    id: p.id,
    title: p.title,
    property_type: TYPE_LABEL[p.type] || p.type,
    status: STATUS_LABEL[p.status] || "Available",
    on_website: p.status === "ACTIVE",
    district: p.district || p.city,
    area: p.locality,
    city: p.city,
    extent: `${p.area} ${UNIT_LABEL[p.areaUnit || "SQFT"] || ""}`.trim(),
    road_facing: p.roadFacing || "",
    price: p.price,
    owner_name: priv.ownerName || "",
    owner_mobile: priv.ownerPhone || "",
    submitter_name: priv.sourceName || "",
    submitter_mobile: priv.sourcePhone || "",
    survey_number: priv.surveyNumber || "",
    maps_link: p.mapsLink || "",
    doc_checklist: checklist,
    doc_files: files,
    photos: (p.media || []).filter((m) => m.type === "IMAGE").map((m) => m.url),
    notes: priv.notes || "",
    view_count: p.viewCount || 0,
    created_at: new Date(p.createdAt).toISOString(),
  };
}

export async function listTrackerProperties(adminUids: string[]) {
  if (adminUids.length === 0) return [];
  const snap = await propertiesCol().where("ownerType", "==", "ADMIN").orderBy("createdAt", "desc").limit(1000).get();
  const props = snap.docs.map((d) => docToTyped<PropertyDoc>(d)!);
  const privs = props.length ? await adminDb.getAll(...props.map((p) => privateDetailsRef(p.id))) : [];
  return props.map((p, i) => toTrackerProperty(p, (privs[i]?.exists ? docToTyped<PropertyPrivateDoc>(privs[i]) : {}) || {}));
}
