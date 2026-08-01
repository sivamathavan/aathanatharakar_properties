import { NextResponse } from "next/server";
import { verifyIdToken as verifyAuth } from "@/lib/auth";
import { getUserById, updateUser, usersCol, agentProfilesCol, vendorProfilesCol } from "@/lib/firestore";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/mail";
import { AccountStatus, UserRole } from "@/types";

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
    const authUser = await verifyAuth(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { accountStatus } = body;

    if (!ALLOWED_STATUSES.includes(accountStatus)) {
      return new NextResponse("Invalid account status", { status: 400 });
    }

    // Don't let an admin lock themselves out
    if (params.id === authUser.uid && accountStatus !== AccountStatus.ACTIVE) {
      return new NextResponse(
        "You cannot change your own account status",
        { status: 400 }
      );
    }

    const target = await getUserById(params.id);

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

    // Update status in Firestore
    await updateUser(params.id, { accountStatus });

    // Sync to Firebase Auth status (enable or disable account)
    const isSuspendedOrRejected = 
      accountStatus === AccountStatus.SUSPENDED || 
      accountStatus === AccountStatus.REJECTED;

    await adminAuth.updateUser(params.id, {
      disabled: isSuspendedOrRejected,
    }).catch((err) => console.error("Firebase auth user status sync failed: ", err));

    // Notify user of status changes (non-blocking)
    if (
      accountStatus === AccountStatus.ACTIVE ||
      accountStatus === AccountStatus.REJECTED ||
      accountStatus === AccountStatus.SUSPENDED
    ) {
      const subject =
        accountStatus === AccountStatus.ACTIVE
          ? "Your DK Promoters Account is Approved"
          : accountStatus === AccountStatus.SUSPENDED
          ? "Your DK Promoters Account has been Suspended"
          : "Update on your DK Promoters Application";
      sendEmail({
        to: target.email,
        subject,
        html: `
          <h3>Hello ${target.name},</h3>
          <p>Your account status has been updated to: <strong>${accountStatus}</strong>.</p>
          ${
            accountStatus === AccountStatus.ACTIVE
              ? "<p>You can now log in to access your dashboard and start using the platform.</p>"
              : accountStatus === AccountStatus.SUSPENDED
              ? "<p>If you believe this is in error, please contact support.</p>"
              : ""
          }
          <br/>
          <p>Regards,<br/>DK Promoters Team</p>
        `,
      }).catch(console.error);
    }

    return NextResponse.json({
      id: params.id,
      name: target.name,
      email: target.email,
      role: target.role,
      accountStatus,
    });
  } catch (error) {
    console.error("[ADMIN_USER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyAuth(req);
    if (!authUser || authUser.role !== UserRole.ADMIN) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Don't let an admin delete themselves
    if (params.id === authUser.uid) {
      return new NextResponse("You cannot delete your own admin account", { status: 400 });
    }

    const target = await getUserById(params.id);

    if (!target) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Don't allow deleting other admins
    if (target.role === UserRole.ADMIN) {
      return new NextResponse("Cannot delete another admin account", { status: 403 });
    }

    // Use a batch to clean up Firestore documents
    const batch = adminDb.batch();
    batch.delete(usersCol().doc(params.id));
    
    if (target.role === UserRole.AGENT) {
      batch.delete(agentProfilesCol().doc(params.id));
    } else if (target.role === UserRole.VENDOR) {
      batch.delete(vendorProfilesCol().doc(params.id));
    }

    await batch.commit();

    // Delete user from Firebase Auth
    await adminAuth.deleteUser(params.id).catch((err) => console.error("Firebase auth deletion failed: ", err));

    return NextResponse.json({ success: true, message: "User deleted permanently" });
  } catch (error) {
    console.error("[ADMIN_USER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
