import Link from "next/link";
import { requireAgentPage } from "@/lib/agent-session";
import { serverT } from "@/lib/i18n/server";
import { AccountPanel } from "@/components/dashboard/AccountPanel";

export const metadata = { title: "Account & data" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { agent, limits } = await requireAgentPage();
  const t = await serverT();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Account & data")}</h1>
        <p className="text-sm text-navy-700">{t("Your login details, your data, and how to leave.")}</p>
      </div>
      <dl className="bg-white rounded-card border border-[#E4DED2] p-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-navy-600">{t("Email")}</dt><dd className="text-navy-900 break-all">{agent.email}</dd>
        <dt className="text-navy-600">{t("Login phone")}</dt><dd className="text-navy-900">{agent.phone}</dd>
        <dt className="text-navy-600">{t("Plan")}</dt><dd className="text-navy-900">{limits.name}</dd>
        <dt className="text-navy-600">{t("Member since")}</dt><dd className="text-navy-900">{new Date(agent.createdAt).toLocaleDateString("en-IN")}</dd>
      </dl>
      <p className="text-sm text-navy-700">
        {t("Forgot your password? Use “Forgot password” on the sign-in page.")} <Link href="/privacy" className="underline">{t("How we use your data")}</Link>
      </p>
      <AccountPanel email={agent.email} />
    </div>
  );
}
