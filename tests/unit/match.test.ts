import { test } from "node:test";
import assert from "node:assert/strict";
import { MATCH_MIN, matchLabel, matchesFor, scoreMatch } from "../../lib/match";

const house = { id: "h", listingType: "BUY", type: "HOUSE", city: "Coimbatore", locality: "RS Puram", address: "RS Puram main road", price: 8_500_000, bedrooms: 3 };
const plot = { id: "p", listingType: "BUY", type: "PLOT", city: "Coimbatore", locality: "Vadavalli", address: "Vadavalli", price: 2_800_000, bedrooms: null };
const flat = { id: "f", listingType: "RENT", type: "APARTMENT", city: "Coimbatore", locality: "Saibaba Colony", address: "", price: 18_000, bedrooms: 2 };
const buyer = { listingType: "BUY", types: ["HOUSE"], city: "Coimbatore", localities: ["RS Puram"], budgetMin: 7_000_000, budgetMax: 9_000_000, bedrooms: 3 };

test("a buyer who wants exactly this house scores 100", () => {
  assert.equal(scoreMatch(buyer, house), 100);
  assert.equal(matchLabel(100), "Great match");
});

test("sale buyers never match rentals, and the other way round", () => {
  assert.equal(scoreMatch(buyer, flat), 0);
  assert.equal(scoreMatch({ ...buyer, listingType: "RENT", types: [] }, house), 0);
  assert.ok(scoreMatch({ listingType: "RENT", types: ["APARTMENT"], city: "Coimbatore", localities: [], budgetMax: 20_000, bedrooms: 2 }, flat) >= 70);
});

test("a plot in the same city is not shown to a house buyer", () => {
  assert.ok(scoreMatch(buyer, plot) < MATCH_MIN);
  assert.deepEqual(matchesFor(buyer, [plot, house, flat]).map((m) => m.listing.id), ["h"]);
});

test("slightly over budget still counts, far over does not get budget points", () => {
  const near = scoreMatch(buyer, { ...house, price: 9_800_000 });
  const far = scoreMatch(buyer, { ...house, price: 15_000_000 });
  assert.ok(near > far);
});

test("fewer bedrooms than needed lowers the score", () => {
  assert.ok(scoreMatch(buyer, { ...house, bedrooms: 2 }) < scoreMatch(buyer, house));
});

test("an open requirement (any type, any place, any budget) still matches by city", () => {
  const open = { listingType: "BUY", types: [], city: "Coimbatore", localities: [], budgetMin: null, budgetMax: null, bedrooms: null };
  assert.ok(scoreMatch(open, plot) >= MATCH_MIN);
});
