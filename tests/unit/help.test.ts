import { test } from "node:test";
import assert from "node:assert/strict";
import { helpTopics, STARTERS, type HelpSurface } from "../../lib/help/topics";
import { findTopics, words } from "../../lib/help/search";
import { makeT } from "../../lib/i18n";
import { DEFAULT_PLANS, GRACE_DAYS } from "../../lib/plans";

const t = makeT("en");
const dash = helpTopics(t, { surface: "dashboard", brand: "PropPage", plans: DEFAULT_PLANS });
const site = helpTopics(t, { surface: "site", brand: "PropPage" });
const top = (q: string, topics = dash) => findTopics(q, topics)[0]?.id;

test("typed questions find the right answer (English and Tanglish)", () => {
  assert.equal(top("my page is paused"), "paused");
  assert.equal(top("page theriyala"), "paused");
  assert.equal(top("photo upload aagala"), "photos");
  assert.equal(top("Photos not uploading!!"), "photos");
  assert.equal(top("I paid but plan not activated, UTR 123456789012"), "paid-waiting");
  assert.equal(top("forgot password"), "password");
  assert.equal(top("how to change my link name"), "link-name");
  assert.equal(top("can I use in tamil"), "tamil");
  assert.equal(top("தமிழ்"), "tamil");
  assert.equal(top("can buyers see the owner number"), "owner-phone");
  assert.equal(top("how much does it cost", site), "price");
  assert.equal(top("is there auto debit", site), "contract");
});

test("nonsense and empty questions find nothing", () => {
  assert.deepEqual(findTopics("asdfgh qwerty", dash), []);
  assert.deepEqual(findTopics("", dash), []);
  assert.deepEqual(findTopics("how do I", dash), []);
});

test("answers use the plan numbers when known and leave them out otherwise", () => {
  const photos = dash.find((x) => x.id === "photos")!;
  assert.match(photos.a, /6 photos on the free trial, 10 on Starter and 15 on Pro/);
  const unknown = helpTopics(t, { surface: "dashboard", brand: "PropPage" }).find((x) => x.id === "photos")!;
  assert.doesNotMatch(unknown.a, /\d+ photos/);
  assert.match(site.find((x) => x.id === "trials")!.a, /^One per mobile number\.$/);
  assert.match(dash.find((x) => x.id === "plan-ends")!.a, new RegExp(`${GRACE_DAYS} more days`));
});

test("every starter chip exists on its surface, and links stay inside the site", () => {
  for (const surface of ["dashboard", "site"] as HelpSurface[]) {
    const topics = helpTopics(t, { surface, brand: "PropPage" });
    for (const id of STARTERS[surface]) assert.ok(topics.some((x) => x.id === id), `${surface}: ${id}`);
    for (const x of topics) {
      if (x.link) assert.match(x.link.href, /^\/[a-z]/, x.id);
      assert.doesNotMatch(x.a, /\{\w+\}/, `${x.id} has an unfilled placeholder`);
    }
  }
  // Site visitors are not signed in, so no answer sends them into the dashboard.
  assert.ok(site.every((x) => !x.link?.href.startsWith("/dashboard")));
});

test("words keeps Tamil letters and drops punctuation", () => {
  assert.deepEqual(words("Page “paused”? தமிழ்!"), ["page", "paused", "தமிழ்"]);
});
