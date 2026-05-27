import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const vendorProfile = await prisma.vendorProfile.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!vendorProfile) {
      return new NextResponse("Vendor not found", { status: 404 });
    }

    const lead = await prisma.vendorEnquiry.create({
      data: {
        name: name,
        email: email,
        message: message,
        vendorId: vendorProfile.id,
      }
    });

    // Send email notification to vendor
    const emailHtml = `
      <h2>New Service Enquiry!</h2>
      <p>Hello ${vendorProfile.businessName},</p>
      <p>You have received a new service enquiry from Aadana Tharakar.</p>
      <h3>Enquirer Details:</h3>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
      </ul>
      <h3>Message:</h3>
      <p><em>${message}</em></p>
      <p>Log in to your dashboard to view more details and respond.</p>
    `;

    await sendEmail({
      to: vendorProfile.user.email,
      subject: `New Service Enquiry - Aadana Tharakar`,
      html: emailHtml,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[VENDOR_ENQUIRY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
