import { requireAgentPage } from "@/lib/agent-session";
import { SITE_URL } from "@/lib/site";
import { serverT } from "@/lib/i18n/server";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { BrandingForm } from "@/components/dashboard/BrandingForm";
import { LinkNameForm } from "@/components/dashboard/LinkNameForm";

export const metadata = { title: "Profile & branding" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { agent, limits } = await requireAgentPage();
  const t = await serverT();
  const plain = JSON.parse(JSON.stringify(agent));
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Profile & branding")}</h1>
        <p className="text-sm text-navy-700">{t("This is what clients see at the top of your page.")}</p>
      </div>
      <ProfileForm agent={plain} />
      <section id="branding" className="space-y-3 scroll-mt-20">
        <h2 className="text-lg font-bold text-navy-900">{t("Branding")}</h2>
        <BrandingForm agent={plain} pro={limits.branding} />
      </section>
      <section id="link" className="scroll-mt-20">
        <LinkNameForm slug={agent.slug} siteUrl={SITE_URL} locked={!!agent.slugChangedAt} />
      </section>
    </div>
  );
}
