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
 *   admin@aadanatharakar.in / Admin@2025
 *
 * Does NOT wipe any data — only upserts the admin and (optionally)
 * flips a target user back to ACTIVE.
 */

import { PrismaClient, UserRole, AccountStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@aadanatharakar.in")
    .toLowerCase()
    .trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@2025";
  const reactivateEmail = process.env.REACTIVATE_EMAIL?.toLowerCase().trim();

  const hashed = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      password: hashed,
    },
    create: {
      name: "Admin",
      email: adminEmail,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      password: hashed,
    },
  });

  console.log("\n✓ Admin ready");
  console.log(`  Email:    ${admin.email}`);
  console.log(`  Password: ${adminPassword}`);
  console.log(`  Login at: /admin/login\n`);

  if (reactivateEmail) {
    const target = await prisma.user.findUnique({
      where: { email: reactivateEmail },
    });
    if (!target) {
      console.warn(
        `! No user found with email "${reactivateEmail}" — skipping reactivation.\n`
      );
    } else {
      await prisma.user.update({
        where: { email: reactivateEmail },
        data: { accountStatus: AccountStatus.ACTIVE },
      });
      console.log(`✓ Reactivated user ${reactivateEmail} (now ACTIVE)\n`);
    }
  }
}

main()
  .catch((e) => {
    console.error("Recovery failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
