import { getPlansConfig } from "@/lib/firestore";
import { LandingHero } from "@/components/marketing/LandingHero";
import { Faq, Features, HowItWorks, PrivacyPromise } from "@/components/marketing/LandingSections";
import { Pricing } from "@/components/marketing/Pricing";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "For property agents",
  description: "Put all your listings on one link and share it with clients on WhatsApp. Free trial, then from ₹299 a month.",
};

/** The agent landing page without the buyer listings. The footer links to #pricing here. */
export default async function ForAgentsPage() {
  const plans = await getPlansConfig();

  return (
    <div className="bg-cream-100">
      <LandingHero plans={plans} variant="agents" />
      <HowItWorks />
      <Features />
      <PrivacyPromise />
      <Pricing plans={plans} />
      <Faq plans={plans} />
    </div>
  );
}
