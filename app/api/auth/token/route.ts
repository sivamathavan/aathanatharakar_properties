import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getUserById } from "@/lib/firestore";
import { AccountStatus } from "@/types";

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return new NextResponse("Token is required", { status: 400 });
    }

    // Verify token cryptographically on the server
    const decoded = await adminAuth.verifyIdToken(idToken);
    const user = await getUserById(decoded.uid);

    if (!user) {
      return new NextResponse("User profile not found", { status: 404 });
    }

    if (
      user.accountStatus === AccountStatus.SUSPENDED ||
      user.accountStatus === AccountStatus.REJECTED
    ) {
      return new NextResponse("Your account is not active. Please contact support.", { status: 403 });
    }

    // Set token as an HTTP-only secure cookie
    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set("firebase_token", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[AUTH_TOKEN_POST]", error);
    return new NextResponse("Unauthorized / Invalid Token", { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("firebase_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}
