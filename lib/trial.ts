import { createHash } from "node:crypto";

/**
 * Key for the one-free-trial-per-mobile record. Only a hash is stored, so the
 * record that remains after an account is deleted holds no phone number.
 */
export function trialPhoneKey(phone: string): string {
  return `h_${createHash("sha256").update(`trial:${phone}`).digest("hex")}`;
}
