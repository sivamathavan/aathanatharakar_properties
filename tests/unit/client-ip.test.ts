import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp } from "../../lib/client-ip";

const req = (headers: Record<string, string>) => new Request("http://localhost/", { headers });

test("App Hosting's own header wins over anything the caller sends", () => {
  assert.equal(clientIp(req({ "x-fah-client-ip": "49.37.1.2", "x-forwarded-for": "1.1.1.1, 49.37.1.2, 35.2.2.2" })), "49.37.1.2");
});

test("a faked start of x-forwarded-for doesn't change the address", () => {
  const first = clientIp(req({ "x-forwarded-for": "1.1.1.1, 49.37.1.2" }));
  const second = clientIp(req({ "x-forwarded-for": "2.2.2.2, 49.37.1.2" }));
  assert.equal(first, "49.37.1.2");
  assert.equal(second, first);
});

test("falls back to x-real-ip, then a fixed value", () => {
  assert.equal(clientIp(req({ "x-real-ip": "49.37.1.3" })), "49.37.1.3");
  assert.equal(clientIp(req({})), "unknown");
});
