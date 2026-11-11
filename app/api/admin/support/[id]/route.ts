import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { writeAudit } from "@/lib/firestore";
import { deleteSupportMessage, getSupportMessage, setSupportStatus } from "@/lib/support";
import { UserRole } from "@/types";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ status: z.enum(["NEW", "DONE"]) });

/** Admin → Support: mark a message done, or open it again. */
export async function PATCH(req: Request, props: Params) {
  const { id } = await props.params;
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Please sign in as the admin.", { status: 401 });
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return new NextResponse("Choose New or Done.", { status: 400 });
    if (!(await getSupportMessage(id))) return new NextResponse("This message was already deleted.", { status: 404 });
    await setSupportStatus(id, parsed.data.status);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN_SUPPORT_PATCH]", error);
    return new NextResponse("Could not update the message.", { status: 500 });
  }
}

export async function DELETE(req: Request, props: Params) {
  const { id } = await props.params;
  const admin = await requireRole(req, UserRole.ADMIN);
  if (!admin) return new NextResponse("Please sign in as the admin.", { status: 401 });
  try {
    const msg = await getSupportMessage(id);
    if (!msg) return new NextResponse("This message was already deleted.", { status: 404 });
    await deleteSupportMessage(id);
    await writeAudit(admin.uid, "support.delete", id, { from: msg.agentId || msg.phone });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ADMIN_SUPPORT_DELETE]", error);
    return new NextResponse("Could not delete the message.", { status: 500 });
  }
}
