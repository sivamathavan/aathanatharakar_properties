// "Speak or paste your listing": turns what an agent said (Tamil, English or
// both) or a pasted WhatsApp message into property form fields.
// Server-only. The Claude call is one function; everything around it is pure
// and unit-tested (tests/unit/listing-draft.test.ts).
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { TN_CITIES } from "@/lib/constants";

const PROPERTY_TYPES = ["APARTMENT", "VILLA", "HOUSE", "PLOT", "COMMERCIAL", "WAREHOUSE", "FARM_LAND", "PG_HOSTEL"] as const;
const LISTING_TYPES = ["BUY", "RENT", "LEASE"] as const;
const PRICE_UNITS = ["TOTAL", "PER_SQFT", "PER_MONTH", "PER_YEAR"] as const;
const AREA_UNITS = ["SQFT", "CENT", "ACRE", "GROUND"] as const;
const KEY_FIELDS = ["type", "listingType", "price", "area", "city", "locality"] as const;

/** What the model must return. Everything not stated is null, never guessed. */
export const ListingDraftSchema = z.object({
  title: z.string().describe("Short English title, under 70 characters, e.g. '5 cent residential plot in Vadavalli'"),
  description: z.string().describe("2 to 4 factual sentences in the requested language. No phone numbers, owner names or survey numbers."),
  type: z.enum(PROPERTY_TYPES).nullable(),
  listingType: z.enum(LISTING_TYPES).nullable(),
  price: z.number().nullable().describe("In rupees, as a plain number"),
  priceUnit: z.enum(PRICE_UNITS).nullable(),
  area: z.number().nullable(),
  areaUnit: z.enum(AREA_UNITS).nullable(),
  bedrooms: z.number().nullable(),
  bathrooms: z.number().nullable(),
  city: z.string().nullable().describe("One of the listed cities, spelled exactly as listed, or null"),
  locality: z.string().nullable(),
  address: z.string().nullable().describe("Street or landmark buyers can see. No door numbers."),
  roadFacing: z.string().nullable().describe("e.g. '30 ft road, east facing'"),
  amenities: z.array(z.string()),
  ownerName: z.string().nullable(),
  ownerPhone: z.string().nullable(),
  surveyNumber: z.string().nullable(),
  privateNotes: z.string().nullable().describe("Anything useful that doesn't fit another field, e.g. 'rate quoted as 3 lakh per cent'"),
});

export type ListingDraft = z.infer<typeof ListingDraftSchema>;

export const SYSTEM_PROMPT = `You fill in a property listing form for a real-estate agent in Tamil Nadu, India.

The input is either speech converted to text (it may contain recognition mistakes, and English words may appear in Tamil script) or a message the agent pasted from WhatsApp. It can be Tamil, English, or a mix.

Fill each field only from what the input says. If something isn't stated, return null (or an empty list). Never guess a price, size, city or owner.

Amounts:
- "25 lakhs", "25 லட்சம்", "25L", "25 lac" = 2500000. "1.2 crore", "1.2 கோடி", "1.2 Cr" = 12000000. "35k" = 35000.
- Rent per month → listingType RENT, priceUnit PER_MONTH. Lease/ஒத்தி/போக்கியம் → listingType LEASE; use PER_YEAR only if a yearly amount is stated, otherwise TOTAL.
- A rate per sq.ft → priceUnit PER_SQFT with that rate. A rate per cent, acre or ground → if the size is also given, set price to rate × size with priceUnit TOTAL and record the quoted rate in privateNotes; if not, leave price null and record the rate in privateNotes.
- Otherwise a sale price is TOTAL.

Sizes: cent/cents/சென்ட் → CENT. acre/ஏக்கர் → ACRE. ground/கிரவுண்ட் (2400 sq.ft) → GROUND. sq.ft/sqft/square feet/சதுர அடி → SQFT. Built-up houses and flats are usually in SQFT.

Property type: plot/site/மனை/layout plot → PLOT. Agricultural land, farm, தோட்டம், நிலம், coconut/mango grove → FARM_LAND. Independent house/வீடு → HOUSE. Villa → VILLA. Flat/apartment → APARTMENT. Shop, office, showroom, commercial land/building, கடை → COMMERCIAL. Godown/warehouse → WAREHOUSE. PG/hostel → PG_HOSTEL.

Listing type: for sale/விற்பனை → BUY. Rent/வாடகை → RENT. Lease → LEASE.

City: use one of these exactly as written, matching common spellings (Trichy = Tiruchirappalli area, Kovai = Coimbatore): ${TN_CITIES.join(", ")}. If the place is not in this list, set city to null and put the place name in locality.

Privacy: the owner's name and phone go only in ownerName and ownerPhone, the survey number only in surveyNumber, and only if stated. Never put a phone number, an owner's name or a survey number in the title, description or address.

Write the title in English. Write the description in the language requested. Keep it factual and plain: no exaggeration, nothing that wasn't said.`;

// ─── Claude call ─────────────────────────────────────────────────────────────

/** Model is configurable: LISTING_AI_MODEL (default claude-opus-5-5). */
export function listingModel() {
  return process.env.LISTING_AI_MODEL || "claude-opus-5-5";
}

// Models with server-side refusal fallback on the Claude API.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5", "claude-fable-5-1"]);

export class DraftError extends Error {}

let client: Anthropic | null = null;

export interface DraftResult {
  draft: ListingDraft;
  usage: { inputTokens: number; outputTokens: number };
}

export async function callClaudeForDraft(text: string, writeIn: "en" | "ta"): Promise<DraftResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new DraftError("Voice listing isn't set up yet. Please contact support.");
  client ||= new Anthropic();
  const model = listingModel();
  const useFallback = FALLBACK_MODELS.has(model);

  let response;
  try {
    response = await client.beta.messages.parse({
      model,
      max_tokens: 8000,
      ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      output_config: { effort: "low", format: betaZodOutputFormat(ListingDraftSchema) },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: `Write the description in ${writeIn === "ta" ? "Tamil" : "English"}.\n\n<listing>\n${text}\n</listing>`,
        },
      ],
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new DraftError("Too many requests right now. Try again in a minute.");
    if (err instanceof Anthropic.APIError) {
      console.error("[LISTING_DRAFT]", err.status, err.message);
      throw new DraftError("Couldn't read that right now. Please try again.");
    }
    throw err;
  }

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new DraftError("Couldn't understand that. Describe the property again, or type it in.");
  }
  return {
    draft: response.parsed_output,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  };
}

// ─── Cleaning the model's answer (pure) ──────────────────────────────────────

const PHONE = /(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;

function clean(s: string | null | undefined, max: number): string {
  return String(s ?? "")
    .replace(PHONE, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

function num(n: number | null | undefined, min: number, max: number): number | null {
  return typeof n === "number" && Number.isFinite(n) && n >= min && n <= max ? n : null;
}

const CITY_ALIASES: Record<string, string> = { kovai: "Coimbatore", trichy: "Trichy", tiruchirappalli: "Trichy", madras: "Chennai", tuticorin: "Thoothukudi" };

export function matchCity(name: string | null | undefined): string | null {
  const key = String(name ?? "").trim().toLowerCase();
  if (!key) return null;
  const alias = CITY_ALIASES[key];
  if (alias && TN_CITIES.includes(alias)) return alias;
  return TN_CITIES.find((c) => c.toLowerCase() === key) || null;
}

/** Form values (strings, as the form keeps them) plus what's still missing. */
export function normalizeDraft(d: ListingDraft) {
  const price = num(d.price, 1, 1e11);
  const area = num(d.area, 0.01, 1e7);
  const bedrooms = num(d.bedrooms, 0, 50);
  const bathrooms = num(d.bathrooms, 0, 50);
  let city = matchCity(d.city);
  let locality = clean(d.locality, 120);
  if (!city && d.city && !locality) locality = clean(d.city, 120);
  const listingType = d.listingType ?? null;
  const priceUnit = d.priceUnit ?? (listingType === "RENT" ? "PER_MONTH" : listingType ? "TOTAL" : null);

  const values = {
    title: clean(d.title, 160),
    description: clean(d.description, 5000),
    type: d.type ?? "",
    listingType: listingType ?? "",
    price: price === null ? "" : String(Math.round(price)),
    priceUnit: priceUnit ?? "",
    area: area === null ? "" : String(area),
    areaUnit: d.areaUnit ?? "",
    bedrooms: bedrooms === null ? "" : String(Math.round(bedrooms)),
    bathrooms: bathrooms === null ? "" : String(Math.round(bathrooms)),
    city: city ?? "",
    locality,
    address: clean(d.address, 500),
    roadFacing: clean(d.roadFacing, 80),
    amenities: (d.amenities || []).map((a) => clean(a, 60)).filter(Boolean).slice(0, 30).join(", "),
    ownerName: String(d.ownerName ?? "").trim().slice(0, 120),
    ownerPhone: String(d.ownerPhone ?? "").replace(/[^0-9+\s-]/g, "").trim().slice(0, 20),
    surveyNumber: String(d.surveyNumber ?? "").trim().slice(0, 60),
    privateNotes: String(d.privateNotes ?? "").trim().slice(0, 2000),
  };

  const present: Record<(typeof KEY_FIELDS)[number], boolean> = {
    type: !!values.type,
    listingType: !!values.listingType,
    price: !!values.price,
    area: !!values.area,
    city: !!values.city,
    locality: !!values.locality,
  };
  const missing = KEY_FIELDS.filter((k) => !present[k]);
  return { values, missing };
}

export type NormalizedDraft = ReturnType<typeof normalizeDraft>;

// ─── Local stand-in (emulator only, no API key) ──────────────────────────────

/**
 * A crude stand-in used only with the local emulators (LISTING_AI_FAKE=1), so
 * the form-filling screen can be tested without an API key. Never used in production.
 */
export function fakeDraft(text: string): ListingDraft {
  const t = text.toLowerCase();
  const lakh = t.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|l\b|லட்சம்)/);
  const crore = t.match(/(\d+(?:\.\d+)?)\s*(crore|cr\b|கோடி)/);
  const cents = t.match(/(\d+(?:\.\d+)?)\s*(cent|cents|சென்ட்)/);
  const sqft = t.match(/(\d+(?:\.\d+)?)\s*(sq\.?\s?ft|sqft|square feet)/);
  const acres = t.match(/(\d+(?:\.\d+)?)\s*(acre|acres|ஏக்கர்)/);
  const city = TN_CITIES.find((c) => t.includes(c.toLowerCase())) || null;
  const type = /plot|மனை|site/.test(t) ? "PLOT" : /farm|agri|தோட்டம்/.test(t) ? "FARM_LAND" : /villa/.test(t) ? "VILLA" : /flat|apartment/.test(t) ? "APARTMENT" : /house|வீடு/.test(t) ? "HOUSE" : null;
  const rent = /rent|வாடகை/.test(t);
  const area = cents ? Number(cents[1]) : acres ? Number(acres[1]) : sqft ? Number(sqft[1]) : null;
  return {
    title: `${type ? type.replace("_", " ").toLowerCase() : "Property"}${city ? ` in ${city}` : ""}`,
    description: text.slice(0, 400),
    type,
    listingType: rent ? "RENT" : "BUY",
    price: crore ? Number(crore[1]) * 1e7 : lakh ? Number(lakh[1]) * 1e5 : null,
    priceUnit: rent ? "PER_MONTH" : "TOTAL",
    area,
    areaUnit: cents ? "CENT" : acres ? "ACRE" : sqft ? "SQFT" : null,
    bedrooms: (t.match(/(\d)\s*bhk/) || [])[1] ? Number(t.match(/(\d)\s*bhk/)![1]) : null,
    bathrooms: null,
    city,
    locality: null,
    address: null,
    roadFacing: (t.match(/\d+\s*(ft|feet|அடி)\s*road/) || [null])[0],
    amenities: [],
    ownerName: null,
    ownerPhone: null,
    surveyNumber: null,
    privateNotes: null,
  };
}
