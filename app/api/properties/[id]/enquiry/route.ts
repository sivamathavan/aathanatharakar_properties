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

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: { postedBy: true }
    });

    if (!property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: name,
        email: email,
        message: message,
        propertyId: property.id,
      }
    });

    // Send email notification to property owner
    const emailHtml = `
      <h2>New Property Enquiry!</h2>
      <p>Hello ${property.postedBy.name},</p>
      <p>You have received a new enquiry for your property: <strong>${property.title}</strong></p>
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
      to: property.postedBy.email,
      subject: `New Enquiry for ${property.title} - Aadana Tharakar`,
      html: emailHtml,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[PROPERTY_ENQUIRY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
