import { test } from "node:test";
import assert from "node:assert/strict";
import { draftJsonSchema, redactPhones } from "../../lib/ai/gemini-draft";
import { activeListingModel, listingProvider } from "../../lib/ai/draft";

test("phone numbers never leave the server for Gemini", () => {
  const { text, phones } = redactPhones("Owner Murugan 9842012345, alt +91 94430-55667. Price 28 lakhs, 5 cent.");
  assert.equal(text, "Owner Murugan [phone], alt [phone]. Price 28 lakhs, 5 cent.");
  assert.deepEqual(phones, ["9842012345", "9443055667"]);
});

test("prices and sizes are not mistaken for phone numbers", () => {
  const { text, phones } = redactPhones("1.2 crore, 2400 sqft, survey 245/2B, rent 18000, 12000000");
  assert.equal(phones.length, 0);
  assert.ok(text.includes("12000000"));
});

test("the schema sent to Gemini has every field and no $schema line", () => {
  const schema = draftJsonSchema() as { properties: Record<string, unknown>; required: string[]; $schema?: string };
  assert.equal(schema.$schema, undefined);
  for (const field of ["title", "description", "type", "price", "area", "city", "ownerPhone"]) assert.ok(field in schema.properties, field);
  assert.ok(schema.required.includes("price"));
});

test("one setting switches the provider", () => {
  const saved = { ...process.env };
  try {
    delete process.env.LISTING_AI_PROVIDER;
    delete process.env.LISTING_AI_MODEL;
    assert.equal(listingProvider(), "claude");
    assert.equal(activeListingModel(), "claude-opus-5-5");
    process.env.LISTING_AI_PROVIDER = "gemini";
    delete process.env.LISTING_AI_GEMINI_MODEL;
    assert.equal(listingProvider(), "gemini");
    assert.equal(activeListingModel(), "gemini-3.8-flash");
    process.env.LISTING_AI_GEMINI_MODEL = "gemini-3.5-flash-lite";
    assert.equal(activeListingModel(), "gemini-3.5-flash-lite");
  } finally {
    process.env = saved;
  }
});
