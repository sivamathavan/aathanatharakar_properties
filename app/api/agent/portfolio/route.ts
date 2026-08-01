import { NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/auth";
import { getAgentProfileByUserId, agentProfilesCol } from "@/lib/firestore";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const authUser = await verifyIdToken(req);
    
    if (!authUser || !authUser.uid) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const agentProfile = await getAgentProfileByUserId(authUser.uid);

    if (!agentProfile) {
      return new NextResponse("Agent profile not found", { status: 404 });
    }

    const { media } = await req.json();

    if (!media || !Array.isArray(media)) {
      return new NextResponse("Invalid media array", { status: 400 });
    }

    const batch = adminDb.batch();
    const agentRef = agentProfilesCol().doc(agentProfile.id);
    const mediaCol = agentRef.collection("media");

    // 1. Delete all existing media documents for this agent profile
    const existingMediaSnap = await mediaCol.get();
    existingMediaSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 2. Write new media documents
    media.forEach((m: any, index: number) => {
      const newMediaRef = mediaCol.doc();
      batch.set(newMediaRef, {
        url: m.url,
        type: m.type || "IMAGE",
        publicId: m.url.split('/').pop()?.split('.')[0] || "unknown",
        order: index,
        createdAt: new Date(),
      });
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AGENT_PORTFOLIO_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
