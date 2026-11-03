import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { agentSlugsCol, agentsCol, getPlansConfig, trialPhonesCol, usersCol } from "@/lib/firestore";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { RESERVED_SLUGS, slugify, trialPlan } from "@/lib/plans";
import { escapeHtml, sendEmailWithin } from "@/lib/mail";
import { trialPhoneKey } from "@/lib/trial";
import { AccountStatus, UserRole } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().max(20),
  agencyName: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().min(2, "Choose your city").max(60),
});

function normalizeIndianMobile(raw: string): string | null {
  let digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9][0-9]{9}$/.test(digits) ? digits : null;
}

async function pickSlug(base: string): Promise<string> {
  const root = base && !RESERVED_SLUGS.has(base) ? base : `agent-${Math.random().toString(36).slice(2, 7)}`;
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    if (!(await agentSlugsCol().doc(candidate).get()).exists) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// Agent signup. The caller proves who they are with a fresh Firebase ID token;
// the uid and email come from that token, never from the request body.
export async function POST(req: Request) {
  try {
    if (await checkRateLimit(`signup:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
      return new NextResponse("Too many signups from this network. Try again in an hour.", { status: 429 });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return new NextResponse("Unauthorized", { status: 401 });
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    if ((decoded as any).role) return new NextResponse("This account is already registered.", { status: 400 });
    if (!decoded.email) return new NextResponse("An email address is required.", { status: 400 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const { name, agencyName, city } = parsed.data;
    const phone = normalizeIndianMobile(parsed.data.phone);
    if (!phone) return new NextResponse("Enter a valid 10-digit mobile number.", { status: 400 });

    const plans = await getPlansConfig();
    const slug = await pickSlug(slugify(agencyName || name));
    const now = new Date();
    const email = decoded.email.toLowerCase();

    await adminDb.runTransaction(async (tx) => {
      // One free trial per mobile number; the record is keyed by a hash, not the number.
      const phoneRef = trialPhonesCol().doc(trialPhoneKey(phone));
      const slugRef = agentSlugsCol().doc(slug);
      const [phoneSnap, slugSnap] = await Promise.all([tx.get(phoneRef), tx.get(slugRef)]);
      if (phoneSnap.exists) throw new Error(phoneSnap.data()!.uid ? "PHONE_TAKEN" : "PHONE_USED");
      if (slugSnap.exists) throw new Error("SLUG_TAKEN");

      tx.set(usersCol().doc(decoded.uid), {
        name,
        email,
        phone,
        role: UserRole.AGENT,
        accountStatus: AccountStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      });
      tx.set(agentsCol().doc(decoded.uid), {
        slug,
        displayName: name,
        agencyName: agencyName || null,
        email,
        phone,
        whatsapp: phone,
        city,
        bio: null,
        reraNumber: null,
        photoUrl: null,
        logoUrl: null,
        emailVerified: !!decoded.email_verified,
        plan: trialPlan(plans.trialDays, now),
        createdAt: now,
        updatedAt: now,
      });
      tx.set(slugRef, { uid: decoded.uid, createdAt: now });
      tx.set(phoneRef, { uid: decoded.uid, createdAt: now });
    });

    await adminAuth.setCustomUserClaims(decoded.uid, { role: UserRole.AGENT });
    await adminAuth.updateUser(decoded.uid, { displayName: name }).catch(() => {});

    if (process.env.ADMIN_EMAIL) {
      await sendEmailWithin({
        to: process.env.ADMIN_EMAIL,
        subject: `New agent signup: ${name}`,
        html: `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(agencyName || "no agency")}) from ${escapeHtml(city)} started a free trial.</p><p>Phone: ${escapeHtml(phone)}<br/>Email: ${escapeHtml(email)}<br/>Page: /a/${escapeHtml(slug)}</p>`,
      });
    }

    return NextResponse.json({ success: true, slug }, { status: 201 });
  } catch (error: any) {
    if (error?.message === "PHONE_TAKEN") {
      return new NextResponse("This mobile number already has an account. Sign in instead.", { status: 409 });
    }
    if (error?.message === "PHONE_USED") {
      return new NextResponse("This mobile number already used its free trial. Contact us to start a paid plan.", { status: 409 });
    }
    if (error?.message === "SLUG_TAKEN") {
      return new NextResponse("Please try again.", { status: 409 });
    }
    console.error("[REGISTER_POST]", error);
    return new NextResponse("Signup failed. Please try again.", { status: 500 });
  }
}
