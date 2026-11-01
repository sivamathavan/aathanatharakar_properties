// Everything that names or contacts the product lives here. Change the
// NEXT_PUBLIC_* values (apphosting.yaml / .env) to rename without touching code.
const digits = (v: string | undefined) => String(v || "").replace(/[^0-9]/g, "");

export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "PropPage",
  tagline: "All your properties on one link",
  description:
    "Property agents in Tamil Nadu list their plots, houses and rentals once and share one link with every client on WhatsApp.",
  /** Shown on the home page under the Tamil line. */
  buyerTagline: "Properties from trusted agents across Tamil Nadu",
  /** The business that runs the product (terms, privacy, footer). */
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || "Rturox",
  companyUrl: process.env.NEXT_PUBLIC_COMPANY_URL || "https://rturox.com",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  /** Digits only, e.g. 919876543210. Empty hides the WhatsApp and call buttons. */
  supportWhatsapp: digits(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP),
  /** Grievance officer named in the privacy policy (DPDP Act). Empty shows the company. */
  grievanceOfficer: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER || "",
  themeColor: "#0C2B29",
  backgroundColor: "#F8F6F0",
};
