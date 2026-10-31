import { BRAND } from "@/lib/brand";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = { title: "Privacy policy", description: `How ${BRAND.name} handles personal data.` };

export default function PrivacyPage() {
  const contact = BRAND.supportEmail ? <a href={`mailto:${BRAND.supportEmail}`} className="underline">{BRAND.supportEmail}</a> : "the contact details on our About page";
  return (
    <LegalPage title="Privacy policy" updated="1 November 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Agents:</strong> name, email, mobile number, city, agency name, RERA number and photo you add, and the UTR numbers of your payments.</li>
          <li><strong>Listings:</strong> the details and photos you publish, plus private notes such as owner name and phone and survey number, which only you can see.</li>
          <li><strong>Enquiries:</strong> the name, phone number, optional email and message a visitor sends, delivered only to the agent who owns the listing.</li>
          <li><strong>Usage:</strong> listing view counts, and basic analytics about how the site is used.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>To run your account and page, deliver enquiries, confirm payments, prevent abuse (for example one free trial per mobile number) and contact you about your account. We do not sell personal data.</p>
      </section>
      <section>
        <h2>Where it is stored</h2>
        <p>Data is stored with Google Firebase, with the database in Mumbai, India. Access is limited to you and to {BRAND.company} staff who need it to run the service.</p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>We use one sign-in cookie to keep you logged in for up to 14 days. Saved listings are kept in your own browser.</p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>Under India&apos;s Digital Personal Data Protection Act you can ask to see, correct or delete your data. Agents can edit their profile and delete listings at any time. To close your account or for any request, write to {contact}.</p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p>While your account is open, and for up to 60 days after a plan ends so you can renew. Payment records are kept as long as tax law requires.</p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>{BRAND.company}, operator of {BRAND.name}: {contact}.</p>
      </section>
    </LegalPage>
  );
}
