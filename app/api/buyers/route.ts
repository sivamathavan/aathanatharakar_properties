import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { agentBuyersCol, buyerInputSchema } from "@/lib/buyers";
import { getLeadById } from "@/lib/firestore";
import { checkRateLimit } from "@/lib/rate-limit";
import { UserRole } from "@/types";

// Save a buyer's requirement. Buyers are private to the agent who saved them.
export async function POST(req: Request) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    if (await checkRateLimit(`buyer-add:${user.uid}`, 200, 24 * 60 * 60 * 1000)) {
      return new NextResponse("Too many buyers added today. Try again tomorrow.", { status: 429 });
    }
    const parsed = buyerInputSchema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    if (parsed.data.leadId) {
      const lead = await getLeadById(parsed.data.leadId);
      if (!lead || lead.ownerId !== user.uid) return new NextResponse("Enquiry not found.", { status: 404 });
    }
    const now = new Date();
    const ref = agentBuyersCol().doc();
    await ref.set({ ...parsed.data, ownerId: user.uid, createdAt: now, updatedAt: now });
    return NextResponse.json({ id: ref.id }, { status: 201 });
  } catch (error) {
    console.error("[BUYER_POST]", error);
    return new NextResponse("Could not save the buyer.", { status: 500 });
  }
}
