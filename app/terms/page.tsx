import { BRAND } from "@/lib/brand";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = { title: "Terms of service", description: `Terms for using ${BRAND.name}.` };

export default function TermsPage() {
  const contact = BRAND.supportEmail ? <a href={`mailto:${BRAND.supportEmail}`} className="underline">{BRAND.supportEmail}</a> : "the contact details on our About page";
  return (
    <LegalPage title="Terms of service" updated="1 November 2026">
      <section>
        <h2>1. Who we are</h2>
        <p>{BRAND.name} is run by {BRAND.company} (&ldquo;we&rdquo;). By creating an account or using the site you agree to these terms.</p>
      </section>
      <section>
        <h2>2. What {BRAND.name} does</h2>
        <p>We give property agents a page to publish their listings and receive enquiries. We are not a broker and not a party to any sale, rent or lease. Agreements, payments and commission between agents, owners and buyers are entirely between them.</p>
      </section>
      <section>
        <h2>3. Agent accounts</h2>
        <ul>
          <li>You must be 18 or older and give true details, including a mobile number you use.</li>
          <li>One free trial per person and mobile number.</li>
          <li>Keep your password private. You are responsible for what happens in your account.</li>
          <li>If you are registered under RERA or required to be, you are responsible for complying with it.</li>
        </ul>
      </section>
      <section>
        <h2>4. Listings</h2>
        <ul>
          <li>List only properties you are authorised to market, with accurate prices, sizes and photos.</li>
          <li>Don&apos;t post misleading, duplicate or illegal listings, or photos you don&apos;t have the right to use.</li>
          <li>You keep ownership of your content and allow us to display it on {BRAND.name} and in link previews.</li>
          <li>We may hide or remove listings, or pause accounts, that break these terms.</li>
        </ul>
      </section>
      <section>
        <h2>5. Plans and payment</h2>
        <ul>
          <li>Plans and prices are shown on the pricing page. You pay by UPI for a month or a year at a time.</li>
          <li>Your plan starts or extends once we confirm the payment. Paying early adds the time on top.</li>
          <li>When a plan ends, your page is paused. Your listings stay saved for at least 60 days so you can renew.</li>
          <li>Payments are not refundable for time already used. If something went wrong, contact us and we will look at it.</li>
        </ul>
      </section>
      <section>
        <h2>6. Buyers and visitors</h2>
        <p>Listings come from independent agents. Check every property, its title documents and approvals yourself, ideally with a lawyer, before paying anything.</p>
      </section>
      <section>
        <h2>7. Liability</h2>
        <p>The service is provided as it is. To the extent the law allows, we are not liable for any loss arising from a listing, an agent&apos;s conduct or a property transaction, and our total liability to an agent is limited to the fees they paid us in the previous three months.</p>
      </section>
      <section>
        <h2>8. Changes and contact</h2>
        <p>We may update these terms and will show the new date here. These terms are governed by the laws of India. Questions: {contact}.</p>
      </section>
    </LegalPage>
  );
}
