import { test } from "node:test";
import assert from "node:assert/strict";
import { collectKeys, keysIn } from "../../scripts/i18n-keys";
import { PENDING_TAMIL } from "../../scripts/i18n-pending";
import { TA } from "../../lib/i18n/ta";
import { translate } from "../../lib/i18n";

const placeholders = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join(",");

test("every string on agent screens has a Tamil line (or is listed as waiting for one)", (t) => {
  const pending = new Set(PENDING_TAMIL);
  const missing = collectKeys().filter((k) => !(k in TA));
  const unlisted = missing.filter((k) => !pending.has(k));
  assert.deepEqual(unlisted, [], `Add these to lib/i18n/ta.ts, or to scripts/i18n-pending.ts until the Tamil team does:\n${unlisted.join("\n")}`);
  t.diagnostic(`${missing.length} strings are waiting for Tamil (scripts/i18n-pending.ts)`);
});

test("the waiting-for-Tamil list holds only strings still used on agent screens", () => {
  const used = new Set(collectKeys());
  const stale = PENDING_TAMIL.filter((k) => !used.has(k));
  assert.deepEqual(stale, [], `Remove these from scripts/i18n-pending.ts:\n${stale.join("\n")}`);
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
