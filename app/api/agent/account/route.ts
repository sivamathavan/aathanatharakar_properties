import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase-admin";
import { getRequestUser, SESSION_COOKIE } from "@/lib/auth";
import { deleteAgentAccount } from "@/lib/account";
import { refreshListingCaches } from "@/lib/property-input";
import { sendEmail, escapeHtml } from "@/lib/mail";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/types";

const RECENT_SIGN_IN_S = 5 * 60;

// Delete my account. Needs the typed word DELETE and a sign-in from the last
// five minutes (a fresh ID token), so a forgotten open phone can't do it.
export async function DELETE(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return new NextResponse("Please enter your password again.", { status: 401 });
  try {
    const user = await getRequestUser(req);
    if (!user || user.role !== UserRole.AGENT) return new NextResponse("Please sign in again.", { status: 401 });
    const decoded = await adminAuth.verifyIdToken(auth.slice(7), true);
    if (decoded.uid !== user.uid || Date.now() / 1000 - decoded.auth_time > RECENT_SIGN_IN_S) {
      return new NextResponse("Please enter your password again.", { status: 401 });
    }
    const parsed = z.object({ confirm: z.literal("DELETE") }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return new NextResponse("Type DELETE to confirm.", { status: 400 });

    const { slug, slugs } = await deleteAgentAccount(user.uid);
    refreshListingCaches(slug);
    slugs.forEach((s) => revalidatePath(`/a/${s}`));
    if (process.env.ADMIN_EMAIL) {
      sendEmail({ to: process.env.ADMIN_EMAIL, subject: "An agent deleted their account", html: `<p>${escapeHtml(user.user.name)} (${escapeHtml(user.email)}) deleted their account and data.</p>` }).catch(() => {});
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/", sameSite: "lax" });
    return res;
  } catch (error) {
    console.error("[AGENT_ACCOUNT_DELETE]", error);
    return new NextResponse("Could not delete your account. Please contact support.", { status: 500 });
  }
}
