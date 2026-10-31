import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { BillingError, recordManualPlanPayment, setAgentSuspended } from "@/lib/billing";
import { getAgentById } from "@/lib/firestore";
import { refreshListingCaches } from "@/lib/property-input";
import { UserRole } from "@/types";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("suspend") }),
  z.object({ action: z.literal("restore") }),
  z.object({
    action: z.literal("record-payment"),
    planId: z.enum(["STARTER", "PRO"]),
    period: z.enum(["MONTHLY", "YEARLY"]),
    reference: z.string().trim().max(30).optional().default(""),
  }),
]);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const input = parsed.data;
    if (input.action === "record-payment") {
      await recordManualPlanPayment(params.id, admin.uid, input.planId, input.period, input.reference);
    } else {
      await setAgentSuspended(params.id, admin.uid, input.action === "suspend");
    }
    const agent = await getAgentById(params.id);
    refreshListingCaches(agent?.slug);
    return NextResponse.json(agent);
  } catch (error) {
    if (error instanceof BillingError) return new NextResponse(error.message, { status: 400 });
    console.error("[ADMIN_AGENT_PATCH]", error);
    return new NextResponse("Could not update the agent.", { status: 500 });
  }
}
