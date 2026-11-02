// "Speak or paste your listing" on Google Gemini: same prompt, same fields and
// same cleaning as the Claude version (lib/ai/listing-draft.ts). Server only.
//
// Privacy: on Google's free tier, Google may use what is sent to improve its
// products and people may read it. Phone numbers are therefore taken out of
// the text before it leaves the server and put back into the private
// owner-phone field here. Turning on billing for the Google Cloud project moves
// the key to the paid terms, where Google does not use the data.
import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import * as z from "zod/v4";
import { DraftError, ListingDraftSchema, SYSTEM_PROMPT, type DraftResult } from "@/lib/ai/listing-draft";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function geminiModel() {
  return process.env.LISTING_AI_GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

// Indian mobile numbers, with or without +91, spaces or dashes.
const PHONE = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;

/** Replaces phone numbers with [phone] and returns the numbers found (digits only). */
export function redactPhones(text: string): { text: string; phones: string[] } {
  const phones = (text.match(PHONE) || []).map((p) => p.replace(/\D/g, "").slice(-10));
  return { text: text.replace(PHONE, "[phone]"), phones };
}

/** The draft schema as JSON Schema, without the $schema line Gemini doesn't use. */
export function draftJsonSchema() {
  const { $schema: _drop, ...schema } = z.toJSONSchema(ListingDraftSchema) as Record<string, unknown>;
  return schema;
}

let client: GoogleGenAI | null = null;

export async function callGeminiForDraft(text: string, writeIn: "en" | "ta"): Promise<DraftResult> {
  if (!process.env.GEMINI_API_KEY) throw new DraftError("Voice listing isn't set up yet. Please contact support.");
  client ||= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = geminiModel();
  const { text: safeText, phones } = redactPhones(text);

  let response;
  try {
    response = await client.models.generateContent({
      model,
      contents: `Write the description in ${writeIn === "ta" ? "Tamil" : "English"}.\nPhone numbers were removed and appear as [phone]; leave ownerPhone null.\n\n<listing>\n${safeText}\n</listing>`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: draftJsonSchema(),
        maxOutputTokens: 8000,
        // Little thinking is needed to fill a form (the Claude version uses low effort too).
        ...(model.startsWith("gemini-3") ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
      },
    });
  } catch (err) {
    if (err instanceof ApiError) {
      console.error("[LISTING_DRAFT_GEMINI]", err.status, err.message);
      if (err.status === 429) throw new DraftError("Too many requests right now. Try again in a minute.");
      throw new DraftError("Couldn't read that right now. Please try again.");
    }
    throw err;
  }

  let parsed;
  try {
    parsed = ListingDraftSchema.safeParse(JSON.parse(response.text || ""));
  } catch {
    parsed = null;
  }
  if (!parsed?.success) throw new DraftError("Couldn't understand that. Describe the property again, or type it in.");

  const draft = parsed.data;
  // The number goes only in the private owner-phone field, never to Google.
  if (!draft.ownerPhone && phones.length) draft.ownerPhone = phones[0];
  const usage = response.usageMetadata;
  return {
    draft,
    usage: {
      inputTokens: usage?.promptTokenCount || 0,
      outputTokens: (usage?.candidatesTokenCount || 0) + (usage?.thoughtsTokenCount || 0),
    },
  };
}
