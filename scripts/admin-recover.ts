/**
 * Create or reset the DK Promoters admin account.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' npm run admin:recover
 *
 * Against the emulators, also set FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST.
 * Passwords live only in Firebase Auth; nothing about them is written to Firestore.
 */
import { adminAuth, adminDb } from "../lib/firebase-admin";
import { AccountStatus, UserRole } from "../types";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 10) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).");
    process.exit(1);
  }

  let uid: string;
  try {
    const user = await adminAuth.getUserByEmail(email);
    uid = user.uid;
    await adminAuth.updateUser(uid, { password, disabled: false, emailVerified: true });
    console.log(`Reset password for ${email}`);
  } catch (err: any) {
    if (err.code !== "auth/user-not-found") throw err;
    const user = await adminAuth.createUser({ email, password, emailVerified: true, displayName: "DK Promoters Admin" });
    uid = user.uid;
    console.log(`Created admin ${email}`);
  }

  await adminAuth.setCustomUserClaims(uid, { role: UserRole.ADMIN });
  await adminAuth.revokeRefreshTokens(uid);
  const now = new Date();
  const ref = adminDb.collection("users").doc(uid);
  const existed = (await ref.get()).exists;
  await ref.set(
    { name: "DK Promoters Admin", email, role: UserRole.ADMIN, accountStatus: AccountStatus.ACTIVE, updatedAt: now, ...(existed ? {} : { createdAt: now }) },
    { merge: true }
  );
  console.log("Admin ready. Sign in at /admin/login");
}

main().catch((e) => {
  console.error("Failed:", e.message || e);
  process.exit(1);
});
