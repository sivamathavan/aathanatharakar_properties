import Link from "next/link";
import { Eye, List, MessageSquare, MailWarning, CalendarClock, MapPin, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { getLeadsForOwner, getOwnerProperties } from "@/lib/firestore";
import { daysLeft, effectiveStatus } from "@/lib/plans";
import { followUpState, friendlyDay, istDaysFromToday, istTime } from "@/lib/dates";
import { SITE_URL } from "@/lib/site";
import { serverT } from "@/lib/i18n/server";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { ResendVerification } from "@/components/dashboard/ResendVerification";
import { PropertyStatus } from "@/types";
import { PushAlertsCard } from "@/components/dashboard/PushAlertsCard";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const OPEN = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION"];

export default async function DashboardOverview({ searchParams }: { searchParams: { welcome?: string } }) {
  const { agent, limits } = await requireAgentPage();
  const t = serverT();
  const [properties, leads] = await Promise.all([getOwnerProperties(agent.id), getLeadsForOwner(agent.id, 200)]);
  const active = properties.filter((p) => p.status === PropertyStatus.ACTIVE).length;
  const inPlan = properties.filter((p) => p.status !== PropertyStatus.SOLD && p.status !== PropertyStatus.RENTED).length;
  const views = properties.reduce((s, p) => s + (p.viewCount || 0), 0);
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const pageUrl = `${SITE_URL}/a/${agent.slug}`;
  const status = effectiveStatus(agent.plan);

  // Today: follow-ups due (or overdue) and site visits today or tomorrow.
  const due = leads
    .filter((l) => OPEN.includes(l.status) && ["overdue", "today"].includes(followUpState(l.nextFollowUpAt) || ""))
    .sort((a, b) => new Date(a.nextFollowUpAt!).getTime() - new Date(b.nextFollowUpAt!).getTime());
  const visits = leads
    .filter((l) => l.siteVisitDate && [0, 1].includes(istDaysFromToday(l.siteVisitDate)) && l.status !== "LOST")
    .sort((a, b) => new Date(a.siteVisitDate!).getTime() - new Date(b.siteVisitDate!).getTime());

  const steps = [
    { done: agent.emailVerified, label: t("Confirm your email"), href: "/dashboard#verify" },
    { done: !!agent.photoUrl, label: t("Add your photo"), href: "/dashboard/profile" },
    { done: !!agent.logoUrl && !!agent.brandColor, label: t("Add your logo and pick a colour"), href: "/dashboard/profile#branding" },
    { done: properties.length > 0, label: t("Add your first property"), href: "/dashboard/properties/new" },
    { done: !!agent.slugChangedAt, label: t("Choose your link name"), href: "/dashboard/profile#link" },
    { done: !!agent.firstSharedAt, label: t("Share your page on WhatsApp"), href: "/dashboard/share" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="bg-navy-900 text-white rounded-xl p-6 space-y-3">
        <h1 className="text-xl md:text-2xl font-bold font-display">
          {searchParams.welcome ? t("Welcome to your page, {name}!", { name: agent.displayName }) : t("Welcome, {name}", { name: agent.displayName })}
        </h1>
        <p className="text-gray-300 text-sm">{t("Your property page is the link you send to clients. Every listing you add shows up there.")}</p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <code className="bg-navy-800 text-gold-400 px-3 py-2 rounded text-xs sm:text-sm break-all">{pageUrl}</code>
          <div className="flex gap-2 [&_button]:bg-white">
            <CopyButton text={pageUrl} share />
          </div>
          <Link href={`/a/${agent.slug}`} target="_blank" className="text-sm underline text-gold-400">{t("Open my page")}</Link>
        </div>
      </div>

      {!agent.emailVerified && (
        <div id="verify" className="rounded-card border border-gold-300 bg-gold-50 p-4 flex items-start gap-3 scroll-mt-20">
          <MailWarning className="w-5 h-5 text-gold-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-navy-900">
            <p className="font-semibold">{t("Confirm your email to make your page public.")}</p>
            <p>{t("We sent a link to {email}. After you click it, sign out and sign in again.", { email: agent.email })}</p>
            <ResendVerification />
          </div>
        </div>
      )}

      <PushAlertsCard />

      {doneCount < steps.length && (
        <section aria-labelledby="getting-started" className="bg-white rounded-card border border-[#E4DED2] p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="getting-started" className="font-bold text-navy-900">{t("Get your page ready")}</h2>
            <span className="text-xs font-semibold text-navy-700">{t("{done} of {total} done", { done: doneCount, total: steps.length })}</span>
          </div>
          <div className="h-2 rounded-full bg-navy-50 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount} aria-label={t("Get your page ready")}>
            <div className="h-full bg-gold-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
          </div>
          <ol className="grid sm:grid-cols-2 gap-2">
            {steps.map((s) => (
              <li key={s.label}>
                {s.done ? (
                  <span className="h-11 px-3 flex items-center gap-2 text-sm text-navy-600 line-through decoration-navy-300">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" aria-hidden /> <span className="sr-only">{t("Done")}: </span>{s.label}
                  </span>
                ) : (
                  <Link href={s.href} className="h-11 px-3 flex items-center gap-2 rounded-btn border border-[#E4DED2] text-sm font-semibold text-navy-900 hover:bg-navy-50">
                    <Circle className="w-5 h-5 text-gold-600 shrink-0" aria-hidden /> {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      {doneCount === steps.length && searchParams.welcome && (
        <p className="text-sm text-navy-800 flex items-center gap-2"><PartyPopper className="w-4 h-4 text-gold-600" /> {t("Your page is ready. Keep adding properties and sharing your link.")}</p>
      )}

      {(due.length > 0 || visits.length > 0) && (
        <section aria-labelledby="today-heading" className="bg-white rounded-card border border-gold-300 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="today-heading" className="font-bold text-navy-900 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-gold-600" /> {t("Today")}</h2>
            <Link href="/dashboard/enquiries?view=today" className="text-sm underline text-navy-700">{t("Open")}</Link>
          </div>
          <ul className="divide-y divide-[#E4DED2]">
            {visits.map((l) => (
              <li key={`v-${l.id}`} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-navy-900">{t("Site visit")}: {l.name}</span>
                  <span className="block text-xs text-navy-600 truncate"><MapPin className="w-3 h-3 inline" /> {l.propertyTitle || t("No listing")}</span>
                </span>
                <span className="text-xs font-semibold text-navy-800 shrink-0">{friendlyDay(l.siteVisitDate!, new Date(), { today: t("Today"), tomorrow: t("Tomorrow"), yesterday: t("Yesterday") })} {istTime(l.siteVisitDate!)}</span>
              </li>
            ))}
            {due.map((l) => (
              <li key={`f-${l.id}`} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="font-semibold text-navy-900">{t("Follow up")}: {l.name}</span>
                  <a href={`tel:${l.phone}`} className="block text-xs underline text-navy-700">{l.phone}</a>
                </span>
                <span className={`text-xs font-semibold shrink-0 ${followUpState(l.nextFollowUpAt) === "overdue" ? "text-red-700" : "text-navy-800"}`}>
                  {followUpState(l.nextFollowUpAt) === "overdue" ? t("Overdue") : t("Today")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/properties" className="bg-white rounded-card border border-[#E4DED2] p-5 hover:shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-600">
            {t("Listings")} <List className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">
            {inPlan} <span className="text-sm font-normal text-navy-600">{t("of {n}", { n: limits.listingLimit })}</span>
          </p>
          <p className="text-xs text-navy-600">{t("{n} live on your page", { n: active })}</p>
        </Link>
        <Link href="/dashboard/enquiries" className="bg-white rounded-card border border-[#E4DED2] p-5 hover:shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-600">
            {t("Enquiries")} <MessageSquare className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{leads.length}</p>
          <p className="text-xs text-navy-600">{t("{n} new", { n: newLeads })}</p>
        </Link>
        <Link href="/dashboard/stats" className="bg-white rounded-card border border-[#E4DED2] p-5 hover:shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-600">
            {t("Listing views")} <Eye className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900 mt-2">{views}</p>
          <p className="text-xs text-navy-600">{t("See stats for each listing")}</p>
        </Link>
      </div>

      <div className="bg-white rounded-card border border-[#E4DED2] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy-900">{t("Latest enquiries")}</h2>
          <Link href="/dashboard/enquiries" className="text-sm underline text-navy-700">{t("See all")}</Link>
        </div>
        {leads.length === 0 ? (
          <p className="text-sm text-navy-600 py-6 text-center">{t("No enquiries yet. Share your page link on WhatsApp to start getting them.")}</p>
        ) : (
          <ul className="divide-y divide-[#E4DED2]">
            {leads.slice(0, 5).map((l) => (
              <li key={l.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-navy-900">{l.name} · <a href={`tel:${l.phone}`} className="underline">{l.phone}</a></p>
                  <p className="text-xs text-navy-600 truncate">{l.propertyTitle || t("Added by you")}</p>
                </div>
                <span className="text-xs text-navy-500 shrink-0">{new Date(l.createdAt).toLocaleDateString("en-IN")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status !== "ACTIVE" && (
        <p className="text-sm text-navy-700">
          {status === "TRIAL" ? t("Your free trial has {n} days left.", { n: daysLeft(agent.plan) }) : t("Your plan has ended.")}{" "}
          <Link href="/dashboard/billing" className="underline font-semibold">{t("See plans")}</Link>
        </p>
      )}
    </div>
  );
}
