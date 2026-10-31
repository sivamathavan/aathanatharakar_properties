import { RegisterForm } from "@/components/auth/RegisterForm";
import { getPlansConfig } from "@/lib/firestore";

export const metadata = { title: "Start your free trial" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const plans = await getPlansConfig();
  return <RegisterForm trialDays={plans.trialDays} trialListings={plans.plans.TRIAL.listingLimit} />;
}
