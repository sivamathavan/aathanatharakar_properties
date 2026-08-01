import { NextResponse } from "next/server";
import { getVendorProfileById, getUserById, createVendorEnquiry } from "@/lib/firestore";
import { sendEmail } from "@/lib/mail";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const ipBuckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000;
const IP_LIMIT = 5;

function limited(key: string) {
  const now = Date.now();
  const bucket = ipBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > IP_LIMIT;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (limited(ip)) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
      });
    }

    const body = await req.json();
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().slice(0, 160).toLowerCase();
    const phone = String(body.phone || "").trim().slice(0, 20);
    const message = String(body.message || "").trim().slice(0, 2000);

    if (!name || !email || !message) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!isValidEmail(email)) {
      return new NextResponse("Invalid email address", { status: 400 });
    }

    const vendorProfile = await getVendorProfileById(params.id);

    if (!vendorProfile) {
      return new NextResponse("Vendor not found", { status: 404 });
    }

    const vendorUser = await getUserById(vendorProfile.userId);

    const fullMessage = phone ? `Phone: ${phone}\n\nMessage: ${message}` : message;

    const lead = await createVendorEnquiry({
      name,
      email,
      message: fullMessage,
      vendorId: vendorProfile.id,
      status: "NEW" as any,
    });

    const adminEmail = process.env.ADMIN_EMAIL;

    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Service Lead — ${vendorProfile.businessName}`,
        html: `
          <h2>New Service Enquiry</h2>
          <h3>Vendor</h3>
          <ul>
            <li><strong>Business:</strong> ${vendorProfile.businessName}</li>
            <li><strong>Category:</strong> ${vendorProfile.category}</li>
          </ul>
          <h3>Customer (broker-confidential)</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
          </ul>
          <h3>Message</h3>
          <p><em>${message}</em></p>
        `,
      }).catch((err) => console.error("[BROKER_VENDOR_EMAIL_ERR]", err));
    }

    if (vendorUser?.email) {
      sendEmail({
        to: vendorUser.email,
        subject: `New service lead for ${vendorProfile.businessName} — DK Promoters`,
        html: `
          <p>Hello ${vendorUser.name || vendorProfile.businessName},</p>
          <p>You have received a new service enquiry on DK Promoters.</p>
          <p>Our broker team will reach out to the customer and coordinate next steps with you shortly.
             Customer contact details are kept confidential and managed by DK Promoters.</p>
          <br/>
          <p>Regards,<br/>DK Promoters Team</p>
        `,
      }).catch((err) => console.error("[VENDOR_EMAIL_ERR]", err));
    }

    return NextResponse.json({ id: lead.id, createdAt: lead.createdAt });
  } catch (error) {
    console.error("[VENDOR_ENQUIRY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
