import { test } from "node:test";
import assert from "node:assert/strict";
import { errorText } from "../../lib/notify";

const res = (body: string, type = "text/plain;charset=UTF-8", status = 400) => new Response(body, { status, headers: { "Content-Type": type } });

test("a short plain-text reason from the server is shown as it is", async () => {
  assert.equal(await errorText(res("Too many enquiries. Please try again in a few minutes."), "Could not send."), "Too many enquiries. Please try again in a few minutes.");
});

test("HTML error pages, long bodies and empty bodies fall back to our own wording", async () => {
  assert.equal(await errorText(res("<!DOCTYPE html><html>502 Bad Gateway</html>", "text/html", 502), "Could not save."), "Could not save.");
  assert.equal(await errorText(res("<html>oops</html>", "text/plain"), "Could not save."), "Could not save.");
  assert.equal(await errorText(res("x".repeat(500)), "Could not save."), "Could not save.");
  assert.equal(await errorText(res("", "text/plain", 500), "Could not save."), "Could not save.");
});

test("JSON errors show their message, never the raw JSON", async () => {
  assert.equal(await errorText(res(JSON.stringify({ error: "Listing not found." }), "application/json"), "Could not save."), "Listing not found.");
  assert.equal(await errorText(res(JSON.stringify({ code: 13 }), "application/json"), "Could not save."), "Could not save.");
  assert.equal(await errorText(res("{not json", "application/json"), "Could not save."), "Could not save.");
});
