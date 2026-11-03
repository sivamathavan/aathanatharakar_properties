import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWhatsAppPaste, phoneKey } from "../../lib/wa-paste";

test("Indian mobile numbers in every common shape become 10 digits", () => {
  for (const raw of ["9840123456", "98401 23456", "+91 98401 23456", "+91-98401-23456", "098401 23456", "91 9840123456", "(984) 012-3456"]) {
    assert.equal(phoneKey(raw), "9840123456", raw);
  }
  assert.equal(phoneKey("1234567890"), "");
  assert.equal(phoneKey("044 2345 6789"), "");
  assert.equal(phoneKey(""), "");
});

test("one copied Android message gives the sender and what they asked", () => {
  const r = parseWhatsAppPaste("[3/11, 10:15 am] Priya Raman: Is the Vadavalli plot still available? Budget 25 L");
  assert.deepEqual(r, { name: "Priya Raman", phone: "", message: "Is the Vadavalli plot still available? Budget 25 L" });
});

test("iPhone copy with seconds and AM/PM", () => {
  const r = parseWhatsAppPaste("[03/11/26, 10:15:12 AM] Karthik S: Need 2 BHK for rent in RS Puram");
  assert.equal(r.name, "Karthik S");
  assert.equal(r.message, "Need 2 BHK for rent in RS Puram");
});

test("an exported chat line with a dash", () => {
  const r = parseWhatsAppPaste("03/11/2026, 9:05 pm - Mohammed Irfan: Call me on 99522 34567 for the house");
  assert.equal(r.name, "Mohammed Irfan");
  assert.equal(r.phone, "9952234567");
});

test("an unsaved number as the sender becomes the phone, not the name", () => {
  const r = parseWhatsAppPaste("[3/11, 10:15 am] +91 97890 34567: Hi, saw your plot ad");
  assert.deepEqual(r, { name: "", phone: "9789034567", message: "Hi, saw your plot ad" });
});

test("in a copied conversation the client is the one who isn't the agent", () => {
  const text = [
    "[3/11, 10:15 am] Senthil Kumar: Hi sir, plot is available",
    "[3/11, 10:16 am] Lakshmi N: What is the final price?",
    "[3/11, 10:17 am] Lakshmi N: Can we see it Sunday?",
  ].join("\n");
  const r = parseWhatsAppPaste(text, ["Senthil Kumar"]);
  assert.equal(r.name, "Lakshmi N");
  assert.equal(r.message, "What is the final price? Can we see it Sunday?");
});

test("a message that runs onto more lines stays together", () => {
  const r = parseWhatsAppPaste("[3/11, 10:15 am] Divya S: Looking for a house\nnear school\nbudget 50 lakhs");
  assert.equal(r.message, "Looking for a house near school budget 50 lakhs");
});

test("Tamil names and messages are kept", () => {
  const r = parseWhatsAppPaste("[3/11, 10:15 am] செல்வி: வடவள்ளியில் மனை வேண்டும்");
  assert.equal(r.name, "செல்வி");
  assert.equal(r.message, "வடவள்ளியில் மனை வேண்டும்");
});

test("a shared contact: name line and number line", () => {
  assert.deepEqual(parseWhatsAppPaste("Arun Kumar\n+91 97875 67890"), { name: "Arun Kumar", phone: "9787567890", message: "" });
});

test("labelled lines", () => {
  const r = parseWhatsAppPaste("Name: Selvi Murugan\nPhone: 98427 89012\n2 BHK near school, budget 50 L");
  assert.deepEqual(r, { name: "Selvi Murugan", phone: "9842789012", message: "2 BHK near school, budget 50 L" });
});

test("plain text with a number inside keeps the words as the requirement", () => {
  const r = parseWhatsAppPaste("Ravi wants 3 BHK in Vadavalli, call 98940 11223");
  assert.equal(r.phone, "9894011223");
  assert.equal(r.message, "Ravi wants 3 BHK in Vadavalli, call");
  assert.equal(r.name, "");
});

test("nothing useful gives empty fields, not a guess", () => {
  assert.deepEqual(parseWhatsAppPaste("   "), { name: "", phone: "", message: "" });
});
