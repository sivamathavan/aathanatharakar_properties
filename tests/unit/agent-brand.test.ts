import { test } from "node:test";
import assert from "node:assert/strict";
import { BRAND_PRESETS, brandPreset, contrastRatio, ownAgentImage, validSlugChoice } from "../../lib/agent-brand";

test("every page colour keeps white text and the accent readable (WCAG 4.5:1)", () => {
  assert.equal(BRAND_PRESETS.length, 12);
  for (const p of BRAND_PRESETS) {
    assert.ok(contrastRatio("#FFFFFF", p.bg) >= 4.5, `${p.id}: white on ${p.bg}`);
    assert.ok(contrastRatio(p.accent, p.bg) >= 4.5, `${p.id}: ${p.accent} on ${p.bg}`);
  }
});

test("contrast maths matches known values", () => {
  assert.equal(Math.round(contrastRatio("#000000", "#FFFFFF")), 21);
  assert.equal(contrastRatio("#777777", "#777777"), 1);
});

test("unknown colour falls back to the default theme", () => {
  assert.equal(brandPreset("nope").id, "teal");
  assert.equal(brandPreset(null).id, "teal");
  assert.equal(brandPreset("maroon").id, "maroon");
});

test("link names: short, plain and hyphenated", () => {
  assert.equal(validSlugChoice("meena-realty"), null);
  assert.equal(validSlugChoice("kumar2"), null);
  assert.ok(validSlugChoice("ab"));
  assert.ok(validSlugChoice("a".repeat(41)));
  assert.ok(validSlugChoice("meena--realty"));
  assert.ok(validSlugChoice("-meena"));
  assert.ok(validSlugChoice("மீனா"));
});

test("profile images must come from the agent's own folder", () => {
  const own = "https://firebasestorage.googleapis.com/v0/b/x/o/agents%2Fuid1%2Flogo.jpg?alt=media";
  assert.equal(ownAgentImage(own, "uid1"), true);
  assert.equal(ownAgentImage(own, "uid2"), false);
  assert.equal(ownAgentImage("", "uid1"), true);
  assert.equal(ownAgentImage("https://evil.example/agents%2Fuid2%2Fx.jpg", "uid1"), false);
});
