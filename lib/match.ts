// Buyer ↔ listing matching for an agent's own clients and listings.
// Weights follow the admin Tracker's scorer (components/tracker/ReMatchTab.tsx):
// place first, then property type, then budget. Pure: safe for client and server.

// Plain shapes (not the Firestore docs) so the browser can call this with page data.
export interface MatchBuyer {
  listingType: string; // BUY | RENT
  types: string[];
  city?: string | null;
  localities: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  bedrooms?: number | null;
}
export interface MatchTarget {
  listingType: string;
  type: string;
  city: string;
  locality: string;
  address: string;
  price: number;
  bedrooms?: number | null;
}
type Buyer = MatchBuyer;
type Listing = MatchTarget;

export const MATCH_MIN = 50;

/** 0–100. Sale buyers never match rentals and the other way round. */
export function scoreMatch(buyer: Buyer, listing: Listing): number {
  const wantsRent = buyer.listingType === "RENT";
  const isRent = listing.listingType === "RENT" || listing.listingType === "LEASE";
  if (wantsRent !== isRent) return 0;

  let score = 0;
  // Place
  if (!buyer.city) score += 15;
  else if (buyer.city.toLowerCase() === listing.city.toLowerCase()) score += 30;
  const where = `${listing.locality} ${listing.address}`.toLowerCase();
  const localities = (buyer.localities || []).map((l) => l.trim().toLowerCase()).filter(Boolean);
  if (!localities.length) score += 10;
  else if (localities.some((l) => where.includes(l))) score += 20;

  // Type
  if (!buyer.types?.length) score += 12;
  else if (buyer.types.includes(listing.type)) score += 25;

  // Budget
  const price = Number(listing.price) || 0;
  const min = buyer.budgetMin || 0;
  const max = buyer.budgetMax || 0;
  if (!min && !max) score += 10;
  else if ((!max || price <= max) && price >= min) score += 20;
  else if (max && price > max && price <= max * 1.1) score += 10; // up to 10% over: still worth a call
  else if (min && price < min) score += 10; // cheaper than they planned

  // Bedrooms
  if (buyer.bedrooms && listing.bedrooms) score += listing.bedrooms >= buyer.bedrooms ? 5 : -10;

  return Math.max(0, Math.min(100, score));
}

export function matchLabel(score: number): "Great match" | "Good match" | "Partial match" {
  return score >= 70 ? "Great match" : score >= 50 ? "Good match" : "Partial match";
}

/** Listings for one buyer, best first, above the minimum score. */
export function matchesFor<L extends Listing & { id: string }>(buyer: Buyer, listings: L[], min = MATCH_MIN) {
  return listings
    .map((listing) => ({ listing, score: scoreMatch(buyer, listing) }))
    .filter((m) => m.score >= min)
    .sort((a, b) => b.score - a.score);
}
