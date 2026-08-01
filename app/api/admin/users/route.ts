import { NextResponse } from "next/server";
import { getAllUsers, getAgentProfileByUserId, getVendorProfileByUserId } from "@/lib/firestore";
import { UserRole } from "@/types";
import { verifyIdToken as verifyAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const users = await getAllUsers();
    
    // Enrich users with profiles in parallel
    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        let agentProfile = null;
        let vendorProfile = null;

        if (u.role === UserRole.AGENT) {
          agentProfile = await getAgentProfileByUserId(u.id);
        } else if (u.role === UserRole.VENDOR) {
          vendorProfile = await getVendorProfileByUserId(u.id);
        }

        return {
          ...u,
          agentProfile,
          vendorProfile,
        };
      })
    );

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
