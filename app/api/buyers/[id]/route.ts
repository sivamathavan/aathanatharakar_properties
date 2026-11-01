import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { agentBuyersCol, buyerInputSchema, getOwnBuyer } from "@/lib/buyers";
import { UserRole } from "@/types";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  try {
    const buyer = await getOwnBuyer(params.id, user.uid);
    if (!buyer) return new NextResponse("Buyer not found.", { status: 404 });
    const parsed = buyerInputSchema.safeParse(await req.json());
    if (!parsed.success) return new NextResponse(parsed.error.issues[0].message, { status: 400 });
    const { leadId: _keep, ...rest } = parsed.data;
    await agentBuyersCol().doc(params.id).update({ ...rest, updatedAt: new Date() });
    return NextResponse.json({ id: params.id });
  } catch (error) {
    console.error("[BUYER_PUT]", error);
    return new NextResponse("Could not save the buyer.", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const user = await requireRole(req, UserRole.AGENT);
  if (!user) return new NextResponse("Please sign in again.", { status: 401 });
  const buyer = await getOwnBuyer(params.id, user.uid);
  if (!buyer) return new NextResponse("Buyer not found.", { status: 404 });
  await agentBuyersCol().doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
