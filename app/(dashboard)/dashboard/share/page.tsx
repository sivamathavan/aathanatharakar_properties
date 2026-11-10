import { requireAgentPage } from "@/lib/agent-session";
import { SITE_URL } from "@/lib/site";
import { waNumber } from "@/lib/plans";
import { serverT } from "@/lib/i18n/server";
import { SharePanel } from "@/components/dashboard/SharePanel";

export const metadata = { title: "Share my page" };
export const dynamic = "force-dynamic";

export default async function SharePage() {
  const { agent } = await requireAgentPage();
  const t = await serverT();
  const url = `${SITE_URL}/a/${agent.slug}`;
  const message = `${t("Hi! See all my properties here:")} ${url}\n— ${agent.displayName}${agent.agencyName ? `, ${agent.agencyName}` : ""}`;
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t("Share my page")}</h1>
        <p className="text-sm text-navy-700">{t("Send this link to clients, put it in your WhatsApp status, or print the QR code on your visiting card.")}</p>
      </div>
      <SharePanel
        url={url}
        message={message}
        slug={agent.slug}
        agent={{
          displayName: agent.displayName,
          agencyName: agent.agencyName,
          tagline: agent.tagline,
          phone: waNumber(agent.whatsapp),
          city: agent.city,
          officeAddress: agent.officeAddress,
          reraNumber: agent.reraNumber,
          photoUrl: agent.photoUrl,
          logoUrl: agent.logoUrl,
          brandColor: agent.brandColor,
        }}
      />
    </div>
  );
}
