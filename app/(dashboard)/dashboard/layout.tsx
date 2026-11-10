import { DictationDock } from "@/components/voice/DictationDock";
import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { requireAgentPage } from "@/lib/agent-session";
import { daysLeft, effectiveStatus, graceEndsAt, graceDaysLeft } from "@/lib/plans";
import { getLang } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { AgentBottomNav, AgentSidebar } from "@/components/dashboard/AgentNav";
import { SupportLinks, hasSupport } from "@/components/support/SupportLinks";
import { GetAppLink } from "@/components/app/GetAppLink";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { agent, limits } = await requireAgentPage();
  const lang = await getLang();
  const t = makeT(lang);
  const status = effectiveStatus(agent.plan);
  const left = daysLeft(agent.plan);

  const banner =
    status === "EXPIRED" ? (
      <div role="status" className="bg-red-700 text-white text-sm px-4 py-3">
        {t("Your plan has ended, so your page is paused.")} <Link href="/dashboard/billing" className="underline font-semibold">{t("Renew now")}</Link>
      </div>
    ) : status === "SUSPENDED" ? (
      <div role="status" className="bg-red-700 text-white text-sm px-4 py-3 space-y-2">
        <p>{t("Your account is paused. Please contact {brand} support.", { brand: BRAND.name })}</p>
        <SupportLinks message={`Hi ${BRAND.name} team, my account (${agent.email}) is paused.`} />
      </div>
    ) : status === "GRACE" ? (
      <div role="status" className="bg-red-700 text-white text-sm px-4 py-3">
        {t("Your plan has ended. Your page stays live until {date}, then it pauses.", { date: graceEndsAt(agent.plan).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }) })}{" "}
        <Link href="/dashboard/billing" className="underline font-semibold">{t("Renew now")}</Link>
      </div>
    ) : left <= 5 ? (
      <div role="status" className="bg-gold-500 text-navy-900 text-sm px-4 py-3">
        {status === "TRIAL" ? t("Free trial ends in {n} days.", { n: left }) : t("{plan} plan ends in {n} days.", { plan: limits.name, n: left })}{" "}
        <Link href="/dashboard/billing" className="underline font-semibold">{t("Renew")}</Link>
      </div>
    ) : null;

  const planLine =
    status === "TRIAL"
      ? t("Free trial · {n} days left", { n: left })
      : status === "ACTIVE"
      ? t("{plan} plan · {n} days left", { plan: limits.name, n: left })
      : status === "SUSPENDED"
      ? t("Paused")
      : status === "GRACE"
      ? t("Plan ended · page live {n} more days", { n: graceDaysLeft(agent.plan) })
      : t("Plan ended");

  const help = (
    <>
      <GetAppLink />
      {hasSupport() ? (
        <SupportLinks message={`Hi ${BRAND.name} team, I'm ${agent.displayName} (${agent.email}). I need help with:`} />
      ) : (
        <p className="text-xs text-navy-600">{t("Need help? Reply to any email from us.")}</p>
      )}
    </>
  );

  return (
    <I18nProvider lang={lang}>
      <div className="flex min-h-[calc(100vh-68px)] bg-warm-cream flex-col md:flex-row pb-16 md:pb-0">
        <AgentSidebar name={agent.displayName} planLine={planLine} help={help} />
        <div className="flex-1 min-w-0 overflow-y-auto">
          {banner}
          <div className="p-4 md:p-8">{children}</div>
        </div>
        <DictationDock mobileBottom={92} />
        <AgentBottomNav help={help} />
      </div>
    </I18nProvider>
  );
}
