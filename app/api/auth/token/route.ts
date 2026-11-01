import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { agentsCol, getAgentById, getUserById } from "@/lib/firestore";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth";
import { AccountStatus, UserRole } from "@/types";

const RECENT_SIGN_IN_MS = 5 * 60 * 1000;

// Exchanges a fresh Firebase ID token for a 14-day session cookie.
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== "string") {
      return new NextResponse("Token is required", { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken, true);
    if (Date.now() / 1000 - decoded.auth_time > RECENT_SIGN_IN_MS / 1000) {
      return new NextResponse("Please sign in again", { status: 401 });
    }

    const role = (decoded as any).role as UserRole | undefined;
    const user = await getUserById(decoded.uid);
    if (!role || !user) {
      return new NextResponse("Account not found. Please sign up first.", { status: 404 });
    }
    if (user.accountStatus === AccountStatus.SUSPENDED || user.accountStatus === AccountStatus.REJECTED) {
      return new NextResponse("Your account is not active. Please contact support.", { status: 403 });
    }

    // Remember email verification on the agent profile; the public page needs it.
    if (role === UserRole.AGENT && decoded.email_verified) {
      const agent = await getAgentById(decoded.uid);
      if (agent && !agent.emailVerified) {
        await agentsCol().doc(decoded.uid).update({ emailVerified: true, emailVerifiedAt: new Date() });
        revalidatePath(`/a/${agent.slug}`);
      }
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
    const response = NextResponse.json({ success: true, role });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE_MS / 1000,
      path: "/",
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    console.error("[AUTH_TOKEN_POST]", error);
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/", sameSite: "lax" });
  response.cookies.set("firebase_token", "", { maxAge: 0, path: "/" });
  return response;
}
