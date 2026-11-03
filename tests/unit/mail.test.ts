import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, sendEmail, sendEmailWithin } from "../../lib/mail";

const msg = { to: "agent@example.com", subject: "New enquiry", html: "<p>Hi</p>" };

test("without SMTP settings nothing is sent and the caller is told so", async () => {
  for (const k of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"]) delete process.env[k];
  assert.equal(await sendEmail(msg), false);
  assert.equal(await sendEmailWithin(msg, 50), false);
});

test("visitor text is escaped before it goes into an email", () => {
  assert.equal(escapeHtml(`<b>"Ravi" & 'Co'</b>`), "&lt;b&gt;&quot;Ravi&quot; &amp; &#39;Co&#39;&lt;/b&gt;");
});
