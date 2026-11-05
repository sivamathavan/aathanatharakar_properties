import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const live = readFileSync(new URL("../../apphosting.yaml", import.meta.url), "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("#"));

test("apphosting.yaml has no empty values, which App Hosting refuses to build", () => {
  const empty = live.filter((line) => /^\s+value:\s*(""|'')?\s*$/.test(line));
  assert.deepEqual(empty, []);
});

test("apphosting.yaml has no placeholders in the Firebase settings", () => {
  const firebase = live.filter((line) => /firebase|proppage\.|201162566035/i.test(line));
  assert.deepEqual(firebase.filter((line) => line.includes("REPLACE-WITH")), []);
});
