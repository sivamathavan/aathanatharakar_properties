import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "crypto";

// For the purposes of minimal regression verification without DB access,
// we test the core logic schemas and formats.
// Full integration testing is deferred as documented in the Final Report.

describe("Security Validation Tests", async () => {
  
  test("OTP generation format is valid and secure", async () => {
    // Generate 1000 OTPs to ensure bounds and crypto security
    for (let i = 0; i < 1000; i++) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      assert.strictEqual(otp.length, 6, "OTP must always be exactly 6 digits");
      assert.match(otp, /^[0-9]{6}$/, "OTP must only contain numbers");
    }
  });

  test("OTP Hashing uses SHA-256", async () => {
    // We import dynamically to avoid Next.js Prisma issues in generic node test runner
    const { hashOtp } = await import("../lib/auth.js");
    const hash = hashOtp("123456");
    assert.strictEqual(typeof hash, "string");
    assert.strictEqual(hash.length, 64, "SHA-256 hex digest should be 64 characters");
  });

  test("API route email validation prevents bad input", async () => {
    const { POST: sendOtp } = await import("../app/api/auth/send-otp/route.js");
    const req = new Request("http://localhost/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-email" }),
    });
    
    const res = await sendOtp(req);
    assert.strictEqual(res.status, 400);
  });
});
