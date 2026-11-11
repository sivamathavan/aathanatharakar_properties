import { listSupportMessages } from "@/lib/support";
import { SupportInbox } from "@/components/admin/SupportInbox";
import { hasSupport } from "@/components/support/SupportLinks";

export const metadata = { title: "Support messages · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const messages = await listSupportMessages(200);
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E4DED2] pb-4 space-y-1">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900">Support messages</h1>
        <p className="text-xs text-navy-700">Sent from the Help panel by agents and visitors. Reply on WhatsApp or email, then mark it done.</p>
        {!hasSupport() && (
          <p className="text-xs text-navy-700">
            Agents see no support WhatsApp or email yet: set NEXT_PUBLIC_SUPPORT_WHATSAPP and NEXT_PUBLIC_SUPPORT_EMAIL to show them. Until then this inbox is the only way they can reach you.
          </p>
        )}
      </div>
      <SupportInbox messages={JSON.parse(JSON.stringify(messages))} />
    </div>
  );
}
