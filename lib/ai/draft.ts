// Which AI reads listings. One setting switches it:
//   LISTING_AI_PROVIDER=gemini   Google Gemini (LISTING_AI_GEMINI_MODEL, GEMINI_API_KEY)
//   LISTING_AI_PROVIDER=claude   Claude (LISTING_AI_MODEL, ANTHROPIC_API_KEY) — the default
// Both use the same prompt, fields and cleaning, so the form behaves the same.
import { callClaudeForDraft, listingModel as claudeModel, type DraftResult } from "@/lib/ai/listing-draft";
import { callGeminiForDraft, geminiModel } from "@/lib/ai/gemini-draft";

export type ListingProvider = "claude" | "gemini";

export function listingProvider(): ListingProvider {
  return process.env.LISTING_AI_PROVIDER === "gemini" ? "gemini" : "claude";
}

/** The model that reads listings right now (recorded with each agent's monthly usage). */
export function activeListingModel(): string {
  return listingProvider() === "gemini" ? geminiModel() : claudeModel();
}

export function draftListing(text: string, writeIn: "en" | "ta"): Promise<DraftResult> {
  return listingProvider() === "gemini" ? callGeminiForDraft(text, writeIn) : callClaudeForDraft(text, writeIn);
}
