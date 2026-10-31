// Server-side auth helpers for API routes and server components.
// The role comes only from the verified custom claim, which only the server
// can set. Nothing a browser writes can change it.
import { adminAuth } from "@/lib/firebase-admin";
import { getUserById } from "@/lib/firestore";
import { cookies } from "next/headers";
import { AccountStatus, UserDoc, UserRole } from "@/types";
import type { DecodedIdToken } from "firebase-admin/auth";

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // Firebase maximum

export interface AuthedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
}

function roleFromClaims(decoded: DecodedIdToken): UserRole | null {
  const role = (decoded as any).role;
  return role === UserRole.ADMIN || role === UserRole.AGENT ? role : null;
}

async function toAuthedUser(decoded: DecodedIdToken): Promise<(AuthedUser & { user: UserDoc }) | null> {
  const role = roleFromClaims(decoded);
  if (!role) return null;
  const user = await getUserById(decoded.uid);
  if (!user) return null;
  if (user.accountStatus === AccountStatus.SUSPENDED || user.accountStatus === AccountStatus.REJECTED) return null;
  return {
    uid: decoded.uid,
    email: decoded.email || user.email,
    emailVerified: !!decoded.email_verified,
    role,
    user,
  };
}

function readCookie(header: string, name: string): string | undefined {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1];
}

/**
 * Authenticated caller of an API route: a session cookie (browser) or a
 * `Bearer <ID token>` header (signup, before a session exists).
 */
export async function getRequestUser(request: Request): Promise<(AuthedUser & { user: UserDoc }) | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7), true);
      return toAuthedUser(decoded);
    }
    const session = readCookie(request.headers.get("cookie") || "", SESSION_COOKIE);
    if (!session) return null;
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return toAuthedUser(decoded);
  } catch {
    return null;
  }
}

/** Current user in a server component, or null. */
export async function getServerUser(): Promise<(AuthedUser & { user: UserDoc }) | null> {
  try {
    const session = cookies().get(SESSION_COOKIE)?.value;
    if (!session) return null;
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return toAuthedUser(decoded);
  } catch {
    return null;
  }
}

export async function requireRole(request: Request, role: UserRole) {
  const user = await getRequestUser(request);
  if (!user || user.role !== role) return null;
  return user;
}

export async function setUserRole(uid: string, role: UserRole): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { role });
}
