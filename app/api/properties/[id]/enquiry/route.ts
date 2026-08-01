import { NextResponse } from "next/server";
import { getPropertyById, createLead, getUserById } from "@/lib/firestore";
import { sendEmail } from "@/lib/mail";
import { LeadSource, LeadStatus } from "@/types";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPhone = (s: string) => /^[0-9+\-\s()]{7,20}$/.test(s);

// IP-based rate limit (best effort, instance-scoped)
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

    if (phone && !isValidPhone(phone)) {
      return new NextResponse("Invalid phone number", { status: 400 });
    }

    const property = await getPropertyById(params.id);

    if (!property) {
      return new NextResponse("Property not found", { status: 404 });
    }

    const fullMessage = phone
      ? `Phone: ${phone}\n\nMessage: ${message}`
      : message;

    const lead = await createLead({
      name,
      email,
      message: fullMessage,
      propertyId: property.id,
      status: LeadStatus.NEW,
      source: LeadSource.WEB,
    });

    const adminEmail = process.env.ADMIN_EMAIL;

    // Non-blocking: don't make the user wait for SMTP.
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `New Lead — ${property.title} (${property.city})`,
        html: `
          <h2>New Property Enquiry</h2>
          <p>A buyer has enquired about a listing on DK Promoters.</p>
          <h3>Property</h3>
          <ul>
            <li><strong>Title:</strong> ${property.title}</li>
            <li><strong>Location:</strong> ${property.locality}, ${property.city}</li>
            <li><strong>ID:</strong> ${property.id}</li>
          </ul>
          <h3>Buyer (broker-confidential)</h3>
          <ul>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
          </ul>
          <h3>Message</h3>
          <p><em>${message}</em></p>
          <p>Reach out to the buyer and coordinate with the owner.</p>
        `,
      }).catch((err) => console.error("[BROKER_EMAIL_ERR]", err));
    }

    // Notify owner WITHOUT exposing buyer's direct contact details.
    if (property.postedById) {
      getUserById(property.postedById)
        .then((owner) => {
          if (!owner?.email) return;
          sendEmail({
            to: owner.email,
            subject: `New lead for ${property.title} — DK Promoters`,
            html: `
              <p>Hello ${owner.name},</p>
              <p>You have received a new enquiry for your property
                 <strong>${property.title}</strong> in ${property.locality}, ${property.city}.</p>
              <p>Our broker team will contact the buyer and coordinate the next steps with you shortly.
                 For your security, buyer contact details are kept confidential and managed by DK Promoters.</p>
              <p>You can review the lead summary in your dashboard.</p>
              <br/>
              <p>Regards,<br/>DK Promoters Team</p>
            `,
          }).catch((err) => console.error("[OWNER_EMAIL_ERR]", err));
        })
        .catch(() => {});
    }

    return NextResponse.json({ id: lead.id, createdAt: lead.createdAt });
  } catch (error) {
    console.error("[PROPERTY_ENQUIRY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
