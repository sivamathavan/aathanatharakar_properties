import { DictationDock } from "@/components/voice/DictationDock";
import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { Home, List, MessageSquare, UserCircle, PlusCircle, Share2, CreditCard } from "lucide-react";
import { requireAgentPage } from "@/lib/agent-session";
import { daysLeft, effectiveStatus } from "@/lib/plans";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/properties", label: "My properties", icon: List },
  { href: "/dashboard/properties/new", label: "Add property", icon: PlusCircle },
  { href: "/dashboard/enquiries", label: "Enquiries", icon: MessageSquare },
  { href: "/dashboard/share", label: "Share my page", icon: Share2 },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { agent, limits } = await requireAgentPage();
  const status = effectiveStatus(agent.plan);
  const left = daysLeft(agent.plan);

  const banner =
    status === "EXPIRED" ? (
      <div className="bg-red-600 text-white text-sm px-4 py-3">
        Your plan has ended, so your page is paused. <Link href="/dashboard/billing" className="underline font-semibold">Renew now</Link> to bring it back.
      </div>
    ) : status === "SUSPENDED" ? (
      <div className="bg-red-600 text-white text-sm px-4 py-3">Your account is paused. Please contact {BRAND.name} support.</div>
    ) : left <= 5 ? (
      <div className="bg-gold-500 text-navy-900 text-sm px-4 py-3">
        {status === "TRIAL" ? "Free trial" : `${limits.name} plan`} ends in {left} day{left === 1 ? "" : "s"}.{" "}
        <Link href="/dashboard/billing" className="underline font-semibold">Renew</Link>
      </div>
    ) : null;

  return (
    <div className="flex min-h-[calc(100vh-68px)] bg-warm-cream flex-col md:flex-row pb-16 md:pb-0">
      <aside className="w-64 bg-white border-r border-[#E4DED2] hidden md:flex flex-col shrink-0 font-sans">
        <div className="p-6 border-b border-[#E4DED2]">
          <h2 className="font-display font-semibold text-lg text-navy-900 truncate">{agent.displayName}</h2>
          <p className="text-xs text-navy-700 mt-0.5">
            {status === "TRIAL" ? `Free trial · ${left} days left` : status === "ACTIVE" ? `${limits.name} plan · ${left} days left` : status === "SUSPENDED" ? "Paused" : "Plan ended"}
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-3 px-4 py-2.5 text-navy-800 rounded-btn hover:bg-navy-50 hover:text-gold-600 text-sm font-medium">
              <n.icon className="w-4 h-4 text-gold-500 shrink-0" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#E4DED2]">
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        {banner}
        <div className="p-4 md:p-8">{children}</div>
      </main>

      <DictationDock mobileBottom={92} />
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4DED2] grid grid-cols-5 items-end py-2 pb-safe shadow-lg font-sans">
        {[NAV[0], NAV[1], NAV[2], NAV[3], NAV[6]].map((n) =>
          n.href === "/dashboard/properties/new" ? (
            <Link key={n.href} href={n.href} className="flex flex-col items-center -mt-5 text-[10px] font-bold text-navy-900">
              <span className="w-12 h-12 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center border-2 border-warm-cream shadow-md">
                <PlusCircle className="w-6 h-6" />
              </span>
              <span className="mt-1">Add</span>
            </Link>
          ) : (
            <Link key={n.href} href={n.href} className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-navy-800 py-1">
              <n.icon className="w-5 h-5" />
              <span>{n.label.replace("My properties", "Listings").replace("Plan & billing", "Plan")}</span>
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
