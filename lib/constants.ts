export const TN_CITIES = [
  "Coimbatore", "Chennai", "Madurai", "Salem", "Tiruppur",
  "Erode", "Trichy", "Vellore", "Thanjavur", "Tirunelveli",
  "Thoothukudi", "Nagercoil", "Kanchipuram", "Hosur", "Kumbakonam",
  "Karur", "Namakkal", "Dindigul", "Cuddalore", "Pudukkottai",
  "Ramanathapuram", "Virudhunagar", "Sivakasi", "Theni", "Pollachi",
  "Ooty", "Kodaikanal", "Yercaud", "Krishnagiri", "Dharmapuri"
];

export const VENDOR_CATEGORIES = [
  "BUILDER",
  "INTERIOR_DESIGNER",
  "PAINTER",
  "ELECTRICIAN",
  "PLUMBER",
  "CARPENTER",
  "ARCHITECT",
  "VASTU_CONSULTANT",
  "HOME_LOAN_ADVISOR",
  "MOVERS_PACKERS",
  "TILES_FLOORING",
  "CIVIL_CONTRACTOR"
] as const;

export const PROPERTY_TYPES = [
  "APARTMENT",
  "VILLA",
  "HOUSE",
  "PLOT",
  "COMMERCIAL",
  "WAREHOUSE",
  "FARM_LAND",
  "PG_HOSTEL"
] as const;

// What agents can choose and buyers can filter by. Old "SELL" listings (owner
// sales from the single-broker site) are still accepted and shown as a sale.
export const LISTING_TYPES = [
  "BUY",
  "RENT",
  "LEASE"
] as const;

export const LISTING_TYPE_LABEL: Record<string, string> = { BUY: "For sale", SELL: "For sale", RENT: "For rent", LEASE: "For lease" };
