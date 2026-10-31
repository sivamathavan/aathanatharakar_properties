import Link from "next/link";
import { Eye, List, MessageSquare, MailWarning } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { getLeadsForOwner, getOwnerProperties } from "@/lib/firestore";
import { daysLeft, effectiveStatus } from "@/lib/plans";
import { SITE_URL } from "@/lib/site";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { ResendVerification } from "@/components/dashboard/ResendVerification";
import { PropertyStatus } from "@/types";

export const metadata = { title: "Dashboard | DK Promoters" };
export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const { agent, limits } = await requireAgentPage();
  const [properties, leads] = await Promise.all([getOwnerProperties(agent.id), getLeadsForOwner(agent.id, 50)]);
  const active = properties.filter((p) => p.status === PropertyStatus.ACTIVE).length;
  const views = properties.reduce((s, p) => s + (p.viewCount || 0), 0);
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const pageUrl = `${SITE_URL}/a/${agent.slug}`;
  const status = effectiveStatus(agent.plan);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-navy-900 text-white rounded-xl p-6 space-y-3">
        <h1 className="text-xl md:text-2xl font-bold font-display">Welcome, {agent.displayName}</h1>
        <p className="text-gray-300 text-sm">Your property page is the link you send to clients. Every listing you add shows up there.</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <code className="bg-navy-800 text-gold-400 px-3 py-2 rounded text-xs sm:text-sm break-all">{pageUrl}</code>
          <div className="flex gap-2 [&_button]:bg-white">
            <CopyButton text={pageUrl} />
          </div>
          <Link href={`/a/${agent.slug}`} target="_blank" className="text-sm underline text-gold-400">Open my page</Link>
        </div>
      </div>

      {!agent.emailVerified && (
        <div className="rounded-card border border-gold-300 bg-gold-50 p-4 flex items-start gap-3">
          <MailWarning className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-navy-900">
            <p className="font-semibold">Confirm your email to make your page public.</p>
            <p>We sent a link to {agent.email}. After you click it, sign out and sign in again.</p>
            <ResendVerification />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/properties" className="bg-white rounded-card border border-[#E8E0D0] p-5 hover:shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-600">
            Listings <List className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">
            {properties.length} <span className="text-sm font-normal text-navy-600">of {limits.listingLimit}</span>
          </p>
          <p className="text-xs text-navy-600">{active} live on your page</p>
        </Link>
        <Link href="/dashboard/enquiries" className="bg-white rounded-card border border-[#E8E0D0] p-5 hover:shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-600">
            Enquiries <MessageSquare className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{leads.length}</p>
          <p className="text-xs text-navy-600">{newLeads} new</p>
        </Link>
        <div className="bg-white rounded-card border border-[#E8E0D0] p-5">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-600">
            Page views <Eye className="w-4 h-4 text-gold-600" />
          </div>
          {limits.viewStats ? (
            <p className="text-2xl font-bold text-navy-900 mt-2">{views}</p>
          ) : (
            <p className="text-sm text-navy-700 mt-2">
              See how many people open each listing on the <Link href="/dashboard/billing" className="underline">Pro plan</Link>.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-card border border-[#E8E0D0] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900">Latest enquiries</h2>
          <Link href="/dashboard/enquiries" className="text-sm underline text-navy-700">See all</Link>
        </div>
        {leads.length === 0 ? (
          <p className="text-sm text-navy-600 py-6 text-center">
            No enquiries yet. Share your page link on WhatsApp to start getting them.
          </p>
        ) : (
          <ul className="divide-y divide-[#E8E0D0]">
            {leads.slice(0, 5).map((l) => (
              <li key={l.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-navy-900">{l.name} · <a href={`tel:${l.phone}`} className="underline">{l.phone}</a></p>
                  <p className="text-xs text-navy-600 truncate">{l.propertyTitle}</p>
                </div>
                <span className="text-xs text-navy-500 shrink-0">{new Date(l.createdAt).toLocaleDateString("en-IN")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status !== "ACTIVE" && (
        <p className="text-sm text-navy-700">
          {status === "TRIAL" ? `Your free trial has ${daysLeft(agent.plan)} days left.` : "Your plan has ended."}{" "}
          <Link href="/dashboard/billing" className="underline font-semibold">See plans</Link>
        </p>
      )}
    </div>
  );
}
