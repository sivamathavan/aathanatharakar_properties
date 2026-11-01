import { test } from "node:test";
import assert from "node:assert/strict";
import { collectKeys, keysIn } from "../../scripts/i18n-keys";
import { TA } from "../../lib/i18n/ta";
import { translate } from "../../lib/i18n";

const placeholders = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(",");

test("every string on agent screens has a Tamil line", () => {
  const missing = collectKeys().filter((k) => !(k in TA));
  assert.deepEqual(missing, [], `Add these to lib/i18n/ta.ts:\n${missing.join("\n")}`);
});

test("Tamil lines keep the same {placeholders}", () => {
  for (const [en, ta] of Object.entries(TA)) assert.equal(placeholders(ta), placeholders(en), en);
});

test("translate fills placeholders and falls back to English", () => {
  assert.equal(translate("en", "{n} new", { n: 3 }), "3 new");
  assert.equal(translate("ta", "{n} new", { n: 3 }), "3 புதியவை");
  assert.equal(translate("ta", "No such line"), "No such line");
});

test("the key finder reads ternaries and skips comparisons and lookups", () => {
  assert.deepEqual(keysIn('t(kind === "logo" ? "Change logo" : "Change photo")'), ["Change logo", "Change photo"]);
  assert.deepEqual(keysIn('t(LABEL[x || ""] || "Added by you")'), ["Added by you"]);
  assert.deepEqual(keysIn('setDraft(""); ctx.fillText("x"); t("Save", { n: 1 })'), ["Save"]);
});
