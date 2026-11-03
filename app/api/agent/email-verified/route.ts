import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAuth } from "@/lib/firebase-admin";
import { getRequestUser } from "@/lib/auth";
import { agentsCol, getAgentById } from "@/lib/firestore";
import { checkRateLimit } from "@/lib/rate-limit";
import { UserRole } from "@/types";

// The dashboard calls this after the agent clicked the link in the "confirm your
// email" mail, so the page goes public without signing out and in again. Firebase
// signs the email_verified claim; it is only accepted for the signed-in agent's own
// account and an unrevoked token. The 5-minute rule for new sessions is unchanged.
const schema = z.object({ idToken: z.string().min(20).max(5000) });

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== UserRole.AGENT) return new NextResponse("Please sign in again.", { status: 401 });
  if (await checkRateLimit(`email-verified:${user.uid}`, 30, 24 * 60 * 60 * 1000)) {
    return new NextResponse("Too many checks today. Try again tomorrow.", { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse("Invalid request.", { status: 400 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(parsed.data.idToken, true);
  } catch {
    return new NextResponse("Please sign in again.", { status: 401 });
  }
  if (decoded.uid !== user.uid) return new NextResponse("This isn't your account.", { status: 403 });
  if (!decoded.email_verified) return NextResponse.json({ verified: false });

  const agent = await getAgentById(user.uid);
  if (agent && !agent.emailVerified) {
    await agentsCol().doc(user.uid).update({ emailVerified: true, emailVerifiedAt: new Date() });
    revalidatePath(`/a/${agent.slug}`);
  }
  return NextResponse.json({ verified: true });
}
