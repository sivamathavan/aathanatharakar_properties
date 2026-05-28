import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AccountStatus, UserRole } from "@prisma/client";

const ALLOWED_STATUSES: AccountStatus[] = [
  AccountStatus.PENDING,
  AccountStatus.ACTIVE,
  AccountStatus.REJECTED,
  AccountStatus.SUSPENDED,
];

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { accountStatus } = body;

    if (!ALLOWED_STATUSES.includes(accountStatus)) {
      return new NextResponse("Invalid account status", { status: 400 });
    }

    // Don't let an admin lock themselves out
    if (params.id === session.user.id && accountStatus !== AccountStatus.ACTIVE) {
      return new NextResponse(
        "You cannot change your own account status",
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!target) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Don't allow modifying other admins
    if (target.role === UserRole.ADMIN) {
      return new NextResponse(
        "Cannot modify another admin account",
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { accountStatus },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
      },
    });

    // Notify user of status changes (non-blocking)
    if (
      accountStatus === AccountStatus.ACTIVE ||
      accountStatus === AccountStatus.REJECTED ||
      accountStatus === AccountStatus.SUSPENDED
    ) {
      import("@/lib/mail")
        .then(({ sendEmail }) => {
          const subject =
            accountStatus === AccountStatus.ACTIVE
              ? "Your Aadana Tharakar Account is Approved"
              : accountStatus === AccountStatus.SUSPENDED
              ? "Your Aadana Tharakar Account has been Suspended"
              : "Update on your Aadana Tharakar Application";
          sendEmail({
            to: user.email,
            subject,
            html: `
              <h3>Hello ${user.name},</h3>
              <p>Your account status has been updated to: <strong>${accountStatus}</strong>.</p>
              ${
                accountStatus === AccountStatus.ACTIVE
                  ? "<p>You can now log in to access your dashboard and start using the platform.</p>"
                  : accountStatus === AccountStatus.SUSPENDED
                  ? "<p>If you believe this is in error, please contact support.</p>"
                  : ""
              }
              <br/>
              <p>Regards,<br/>Aadana Tharakar Team</p>
            `,
          }).catch(console.error);
        })
        .catch(console.error);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
