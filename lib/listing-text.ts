// Plain-English listing facts built from fixed fields (type, size, place, price),
// for WhatsApp preview images and search data. Pure: safe for client and server.
import type { PropertyDoc } from "@/types";

const TYPE: Record<string, string> = {
  APARTMENT: "Apartment", VILLA: "Villa", HOUSE: "House", PLOT: "Plot", COMMERCIAL: "Commercial space",
  WAREHOUSE: "Warehouse", FARM_LAND: "Farm land", PG_HOSTEL: "PG / hostel",
};
const AREA: Record<string, string> = { SQFT: "sq.ft", CENT: "cents", ACRE: "acres", GROUND: "grounds" };

type Facts = Pick<PropertyDoc, "type" | "listingType" | "area" | "price"> & Partial<Pick<PropertyDoc, "bedrooms" | "areaUnit" | "priceUnit">>;

export function listingKind(p: Facts): string {
  const forWhat = p.listingType === "RENT" ? "for rent" : p.listingType === "LEASE" ? "for lease" : "for sale";
  return `${p.bedrooms ? `${p.bedrooms} BHK ` : ""}${TYPE[p.type] || "Property"} ${forWhat}`;
}

export function listingArea(p: Facts): string {
  return `${Number(p.area).toLocaleString("en-IN")} ${AREA[p.areaUnit || "SQFT"] || "sq.ft"}`;
}

/** "₹45 L", "₹1.2 Cr", "₹18,000 / month" — short Indian price for previews. */
export function shortPrice(p: Facts): string {
  const n = Number(p.price) || 0;
  const unit = p.priceUnit === "PER_MONTH" ? " / month" : p.priceUnit === "PER_YEAR" ? " / year" : p.priceUnit === "PER_SQFT" ? " / sq.ft" : "";
  let text: string;
  if (n >= 1e7) text = `₹${trim(n / 1e7)} Cr`;
  else if (n >= 1e5) text = `₹${trim(n / 1e5)} L`;
  else text = `₹${n.toLocaleString("en-IN")}`;
  return text + unit;
}

function trim(x: number): string {
  return x.toFixed(2).replace(/\.?0+$/, "");
}

/** True when a string can be drawn with a Latin-only font (no Tamil letters etc.). */
export function isLatin(text: string | null | undefined): boolean {
  return !!text && /^[\u0000-ɏ -⃏]*$/.test(text);
}
