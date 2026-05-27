import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { accountStatus } = body;

    let user;
    if (accountStatus === 'SUSPENDED') {
      user = await prisma.user.delete({
        where: { id: params.id },
      });
      return NextResponse.json({ message: "User deleted" });
    } else {
      user = await prisma.user.update({
        where: { id: params.id },
        data: { accountStatus },
      });

      if (accountStatus === 'ACTIVE' || accountStatus === 'REJECTED') {
        import('@/lib/mail').then(({ sendEmail }) => {
          sendEmail({
            to: user.email,
            subject: accountStatus === 'ACTIVE' 
              ? 'Your Aadana Tharakar Account is Approved!' 
              : 'Update on your Aadana Tharakar Application',
            html: `
              <h3>Hello ${user.name},</h3>
              <p>Your account status has been updated to: <strong>${accountStatus}</strong>.</p>
              ${accountStatus === 'ACTIVE' ? '<p>You can now log in to access your dashboard and start using the platform.</p>' : ''}
              <br/>
              <p>Regards,<br/>Aadana Tharakar Team</p>
            `
          }).catch(console.error);
        });
      }
      return NextResponse.json(user);
    }
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
