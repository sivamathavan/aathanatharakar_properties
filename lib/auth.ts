// Firebase Auth utilities — replaces NextAuth authOptions
// Server-side helpers for API routes
import { adminAuth } from "@/lib/firebase-admin";
import { getUserById, getUserByEmail, incrementRateLimit, getRateLimit, deleteRateLimit } from "@/lib/firestore";
import { createHash } from "crypto";
import { cookies } from "next/headers";
import { AccountStatus, UserRole, UserDoc } from "@/types";

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

// ─── OTP Hashing ────────────────────────────────────────────────────────────

export function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

async function recordFail(key: string) {
  const resetAt = new Date(Date.now() + LOCK_WINDOW_MS);
  await incrementRateLimit(`fail:${key}`, resetAt);
}

async function isLocked(key: string): Promise<boolean> {
  try {
    const bucket = await getRateLimit(`fail:${key}`);
    if (!bucket) return false;
    if (new Date(bucket.resetAt) < new Date()) {
      await deleteRateLimit(`fail:${key}`);
      return false;
    }
    return bucket.count >= MAX_ATTEMPTS;
  } catch {
    return false;
  }
}

async function clearFail(key: string) {
  await deleteRateLimit(`fail:${key}`);
}

// ─── Token Verification (Server-side) ───────────────────────────────────────

/**
 * Verify Firebase ID token from request headers or cookies.
 * Used in API routes and middleware.
 */
export async function verifyIdToken(request: Request): Promise<{ uid: string; email: string; role: UserRole } | null> {
  try {
    // Check Authorization header first
    const authHeader = request.headers.get("Authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split("Bearer ")[1];
    }

    // Fallback to cookie
    if (!token) {
      const cookieHeader = request.headers.get("cookie") || "";
      const match = cookieHeader.match(/firebase_token=([^;]+)/);
      token = match?.[1];
    }

    if (!token) return null;

    const decoded = await adminAuth.verifyIdToken(token);
    const user = await getUserById(decoded.uid);

    if (!user) return null;
    if (user.accountStatus === AccountStatus.SUSPENDED || user.accountStatus === AccountStatus.REJECTED) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email || user.email,
      role: user.role,
    };
  } catch (err) {
    console.error("[verifyIdToken]", err);
    return null;
  }
}

/**
 * Get the current authenticated user from a server component context.
 * Returns null if not authenticated.
 */
export async function getServerUser(): Promise<{ uid: string; email: string; role: UserRole; user: UserDoc } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("firebase_token")?.value;
    if (!token) return null;

    const decoded = await adminAuth.verifyIdToken(token);
    const user = await getUserById(decoded.uid);

    if (!user) return null;
    if (user.accountStatus === AccountStatus.SUSPENDED || user.accountStatus === AccountStatus.REJECTED) {
      return null;
    }

    return {
      uid: decoded.uid,
      email: decoded.email || user.email,
      role: user.role,
      user,
    };
  } catch {
    return null;
  }
}

/**
 * Set custom claims on a Firebase user (for role-based access in security rules).
 */
export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role });
}

// Re-export for backward compatibility
export { recordFail, isLocked, clearFail };
