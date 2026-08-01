/**
 * Non-destructive admin recovery script.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=NewPass@2025 \
 *     npx tsx scripts/admin-recover.ts
 *
 * Optionally reactivates a regular user that got suspended during testing:
 *   REACTIVATE_EMAIL=test-user@example.com npx tsx scripts/admin-recover.ts
 *
 * Without any env vars, defaults to:
 *   admin@dkpromoters.in / Admin@2025
 */

import { adminAuth, adminDb } from "../lib/firebase-admin";
import * as bcrypt from "bcryptjs";
import { UserRole, AccountStatus } from "../types";

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@dkpromoters.in")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@2025";
  const reactivateEmail = process.env.REACTIVATE_EMAIL?.toLowerCase().trim();

  let uid = "";
  try {
    const authUser = await adminAuth.getUserByEmail(adminEmail);
    uid = authUser.uid;
    await adminAuth.updateUser(uid, {
      password: adminPassword,
      disabled: false,
    });
    console.log(`Updated existing Firebase Auth admin user password: ${adminEmail}`);
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      const authUser = await adminAuth.createUser({
        email: adminEmail,
        emailVerified: true,
        displayName: "DK Promoters Admin",
        password: adminPassword,
      });
      uid = authUser.uid;
      console.log(`Created new Firebase Auth admin user: ${adminEmail}`);
    } else {
      throw err;
    }
  }

  // Set admin custom claims
  await adminAuth.setCustomUserClaims(uid, { role: UserRole.ADMIN });

  // Update Firestore user document
  const hashed = await bcrypt.hash(adminPassword, 10);
  await adminDb.collection("users").doc(uid).set({
    name: "DK Promoters Admin",
    email: adminEmail,
    role: UserRole.ADMIN,
    accountStatus: AccountStatus.ACTIVE,
    password: hashed,
    updatedAt: new Date(),
  }, { merge: true });

  console.log("\n✓ Admin ready");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Login at: /admin/login\n`);

  if (reactivateEmail) {
    const usersSnap = await adminDb.collection("users").where("email", "==", reactivateEmail).limit(1).get();
    if (usersSnap.empty) {
      console.warn(
        `! No user found with email "${reactivateEmail}" — skipping reactivation.\n`
      );
    } else {
      const userDoc = usersSnap.docs[0];
      const userId = userDoc.id;
      
      await adminDb.collection("users").doc(userId).update({
        accountStatus: AccountStatus.ACTIVE,
        updatedAt: new Date(),
      });

      await adminAuth.updateUser(userId, { disabled: false }).catch(() => {});
      
      console.log(`✓ Reactivated user ${reactivateEmail} (now ACTIVE)\n`);
    }
  }
}

main()
  .catch((e) => {
    console.error("Recovery failed:", e);
    process.exit(1);
  });
