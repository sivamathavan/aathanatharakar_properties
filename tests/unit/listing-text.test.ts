import { test } from "node:test";
import assert from "node:assert/strict";
import { isLatin, listingArea, listingKind, shortPrice } from "../../lib/listing-text";

test("short Indian prices for previews", () => {
  assert.equal(shortPrice({ price: 8_500_000, type: "HOUSE", listingType: "BUY", area: 1 }), "₹85 L");
  assert.equal(shortPrice({ price: 12_500_000, type: "HOUSE", listingType: "BUY", area: 1 }), "₹1.25 Cr");
  assert.equal(shortPrice({ price: 18_000, priceUnit: "PER_MONTH", type: "APARTMENT", listingType: "RENT", area: 1 }), "₹18,000 / month");
});

test("listing kind and area in plain English", () => {
  assert.equal(listingKind({ type: "HOUSE", listingType: "BUY", bedrooms: 3, area: 1, price: 1 }), "3 BHK House for sale");
  assert.equal(listingKind({ type: "APARTMENT", listingType: "RENT", area: 1, price: 1 }), "Apartment for rent");
  assert.equal(listingArea({ type: "PLOT", listingType: "BUY", area: 5, areaUnit: "CENT", price: 1 }), "5 cents");
});

test("Tamil text is detected so previews leave it out", () => {
  assert.equal(isLatin("Meena Realty"), true);
  assert.equal(isLatin("₹85 L — RS Puram"), true);
  assert.equal(isLatin("மீனா ரியால்டி"), false);
  assert.equal(isLatin(""), false);
});
