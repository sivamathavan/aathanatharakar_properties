// Static blog content shown when the DB has no published posts.
// Detail-page rendering uses this same source so links never 404.

export interface StaticBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  readTime: string;
  category: string;
  publishedAt: string;
  author: string;
}

export const STATIC_POSTS: StaticBlogPost[] = [
  {
    id: "static-1",
    slug: "buying-property-coimbatore-guide",
    title: "Complete Guide to Buying Property in Coimbatore (2025)",
    excerpt:
      "Everything you need to know about purchasing residential or commercial property in Coimbatore — from location selection to registration.",
    content: `Coimbatore is one of the fastest-growing real-estate markets in Tamil Nadu, driven by strong manufacturing, education, and IT employment.

This guide walks you through what every buyer should check:
• Locality fundamentals — connectivity, schools, water supply, future infrastructure plans.
• Title and approvals — DTCP/CMDA layout approval, EC for the last 30 years, mother deed continuity, RERA registration where applicable.
• Loan eligibility — pre-approval, CIBIL score, salaried vs. self-employed documentation.
• Registration and stamp duty — current Tamil Nadu rate, calculation on guideline value vs. market value.
• Negotiation — typical broker margins, when to walk away, lawyer review fee.

Aadana Tharakar handles the broker-side coordination end-to-end so you don't have to chase multiple owners.`,
    coverImageUrl:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
    readTime: "8 min read",
    category: "Buying Guide",
    publishedAt: "2025-05-15",
    author: "Tamilarasan",
  },
  {
    id: "static-2",
    slug: "rera-tamil-nadu-agents-guide",
    title: "RERA Tamil Nadu: What Every Agent and Buyer Must Know",
    excerpt:
      "A complete breakdown of RERA (Real Estate Regulatory Authority) rules in Tamil Nadu — mandatory registrations, penalties, and buyer rights.",
    content: `The Tamil Nadu Real Estate Regulatory Authority (TNRERA) registers projects above 500 sqm or with more than 8 units. Highlights:
• Every project must publish promoter details, approvals, layouts, and timelines.
• Agents handling registered projects must hold a valid TNRERA agent registration.
• Buyers can lodge complaints online and seek refunds + interest for delayed possession.

Always check the TNRERA portal for project registration number before signing a sale agreement.`,
    coverImageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
    readTime: "6 min read",
    category: "Legal & RERA",
    publishedAt: "2025-05-10",
    author: "Aadana Tharakar Team",
  },
  {
    id: "static-3",
    slug: "rent-vs-buy-decision",
    title: "Rent or Buy in Tamil Nadu? A 2025 Financial Analysis",
    excerpt:
      "With property prices rising across Coimbatore, Chennai, and Madurai — is it smarter to rent or buy? We crunch the numbers for you.",
    content: `As a rough rule, dividing annual rent by property value gives you a rental yield. If yields are below 3% and home-loan rates are around 8–9%, renting is mathematically attractive — but doesn't account for capital appreciation or tax benefits.

This article walks through three real Coimbatore case studies (Saravanampatti, Vadavalli, Peelamedu) comparing 20-year buying vs. renting scenarios with realistic appreciation, tax, and maintenance assumptions.`,
    coverImageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    readTime: "7 min read",
    category: "Market Analysis",
    publishedAt: "2025-05-05",
    author: "Aadana Tharakar Team",
  },
  {
    id: "static-4",
    slug: "home-loan-tips-tamil-nadu",
    title: "How to Get the Best Home Loan Rate in Tamil Nadu",
    excerpt:
      "Compare banks, understand eligibility, and negotiate better interest rates. Practical tips to save lakhs on your home loan in 2025.",
    content: `Five tactics that consistently save buyers money:
1. Improve your CIBIL score to 780+ before applying.
2. Get pre-approvals from 3 lenders — let them compete.
3. Choose floating + repo-linked over fixed when rates are near peak.
4. Aim for 20-year tenure max; reduce principal aggressively in the first 7 years.
5. Negotiate processing fees — these are routinely waived for serious buyers.`,
    coverImageUrl:
      "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&q=80",
    readTime: "9 min read",
    category: "Finance",
    publishedAt: "2025-04-28",
    author: "Aadana Tharakar Team",
  },
  {
    id: "static-5",
    slug: "interior-design-budget-homes",
    title: "Budget Interior Design Ideas for Tamil Nadu Homes (₹2–5 Lakh)",
    excerpt:
      "Transform your new home without breaking the bank. Curated interior design tips, vendor recommendations, and local inspiration.",
    content: `A ₹3–4 lakh budget can transform a 1,000–1,200 sqft home if you prioritise correctly:
• Modular kitchen (~₹80k–1.2L) returns the highest livability dividend.
• Built-in wardrobes for bedrooms (~₹30–50k each) save floor space.
• False ceiling + LED lighting (~₹40–60k) modernises the look instantly.
• Skip imported tiles; Vitrified Indian tiles look identical at 40% cost.

Browse vetted interior designers in our Services directory.`,
    coverImageUrl:
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    readTime: "5 min read",
    category: "Interior & Design",
    publishedAt: "2025-04-20",
    author: "Aadana Tharakar Team",
  },
  {
    id: "static-6",
    slug: "property-registration-process-tn",
    title: "Step-by-Step: Property Registration Process in Tamil Nadu",
    excerpt:
      "From SRO office to encumbrance certificate — a complete walkthrough of property registration, stamp duty, and documents needed in Tamil Nadu.",
    content: `Registration is the legal completion of a property purchase:
1. Verify EC (Encumbrance Certificate) for 30 years.
2. Draft the sale deed and finalise stamp duty (7% TN + 4% registration on most sales).
3. Book an SRO (Sub-Registrar Office) slot online via TNREGINET.
4. Both parties + 2 witnesses appear with originals.
5. Pay stamp duty + registration fee; collect endorsed deed in ~7 days.
6. Update Patta and electricity service connection in the new owner's name.`,
    coverImageUrl:
      "https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80",
    readTime: "10 min read",
    category: "Legal & RERA",
    publishedAt: "2025-04-15",
    author: "Tamilarasan",
  },
];

export const STATIC_POSTS_BY_SLUG = Object.fromEntries(
  STATIC_POSTS.map((p) => [p.slug, p])
);
