import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeDraft, matchCity, normalizeDraft, type ListingDraft } from "../../lib/ai/listing-draft";

const base: ListingDraft = {
  title: "5 cent residential plot in Vadavalli",
  description: "Corner plot on a 30 ft road.",
  type: "PLOT",
  listingType: "BUY",
  price: 2500000,
  priceUnit: "TOTAL",
  area: 5,
  areaUnit: "CENT",
  bedrooms: null,
  bathrooms: null,
  city: "Coimbatore",
  locality: "Vadavalli",
  address: null,
  roadFacing: "30 ft road, east facing",
  amenities: ["Compound wall", "Borewell"],
  ownerName: "Rajan",
  ownerPhone: "98654 32100",
  surveyNumber: "145/2A",
  privateNotes: null,
};

test("a complete draft fills the form as strings", () => {
  const { values, missing } = normalizeDraft(base);
  assert.equal(values.price, "2500000");
  assert.equal(values.area, "5");
  assert.equal(values.areaUnit, "CENT");
  assert.equal(values.city, "Coimbatore");
  assert.equal(values.amenities, "Compound wall, Borewell");
  assert.equal(values.ownerPhone, "98654 32100");
  assert.deepEqual(missing, []);
});

test("phone numbers never reach the public title, description or address", () => {
  const { values } = normalizeDraft({
    ...base,
    title: "Plot call 9865432100",
    description: "Contact +91 98654-32100 for details.",
    address: "Near temple, 98654 32100",
  });
  assert.doesNotMatch(values.title, /\d{5}/);
  assert.doesNotMatch(values.description, /\d{5}/);
  assert.doesNotMatch(values.address, /\d{5}/);
  assert.equal(values.ownerPhone, "98654 32100");
});

test("unknown places go to locality, not a made-up city", () => {
  const { values, missing } = normalizeDraft({ ...base, city: "Thudiyalur", locality: null });
  assert.equal(values.city, "");
  assert.equal(values.locality, "Thudiyalur");
  assert.ok(missing.includes("city"));
});

test("city spellings people use are matched", () => {
  assert.equal(matchCity("kovai"), "Coimbatore");
  assert.equal(matchCity("TIRUCHIRAPPALLI"), "Trichy");
  assert.equal(matchCity("madurai"), "Madurai");
  assert.equal(matchCity("Bengaluru"), null);
});

test("absurd numbers are dropped instead of filled", () => {
  const { values, missing } = normalizeDraft({ ...base, price: -5, area: 0, bedrooms: 400 });
  assert.equal(values.price, "");
  assert.equal(values.area, "");
  assert.equal(values.bedrooms, "");
  assert.ok(missing.includes("price") && missing.includes("area"));
});

test("rent defaults to a monthly price", () => {
  const { values } = normalizeDraft({ ...base, listingType: "RENT", priceUnit: null, price: 15000 });
  assert.equal(values.priceUnit, "PER_MONTH");
});

test("nothing stated means nothing filled", () => {
  const { values, missing } = normalizeDraft({
    ...base, type: null, listingType: null, price: null, priceUnit: null, area: null, areaUnit: null,
    city: null, locality: null, roadFacing: null, amenities: [], ownerName: null, ownerPhone: null, surveyNumber: null,
  });
  assert.equal(values.type, "");
  assert.equal(values.priceUnit, "");
  assert.deepEqual(missing, ["type", "listingType", "price", "area", "city", "locality"]);
});

test("the emulator stand-in reads lakhs, cents and a city", () => {
  const d = fakeDraft("5 cent plot in Coimbatore, 30 ft road, 25 lakhs");
  assert.equal(d.price, 2500000);
  assert.equal(d.area, 5);
  assert.equal(d.areaUnit, "CENT");
  assert.equal(d.type, "PLOT");
  assert.equal(d.city, "Coimbatore");
});
