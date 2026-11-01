import { BRAND } from "@/lib/brand";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Phone, Languages, Globe, ArrowLeft } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { waNumber } from "@/lib/plans";
import { brandPreset } from "@/lib/agent-brand";
import { TapLink } from "@/components/agent/TapLink";
import type { AgentDoc } from "@/types";

/** Inline colours for the agent's chosen theme (always a dark background with white text). */
export function agentTheme(agent: Pick<AgentDoc, "brandColor">) {
  const p = brandPreset(agent.brandColor);
  return { bg: p.bg, accent: p.accent, style: { backgroundColor: p.bg, color: "#FFFFFF" } as React.CSSProperties };
}

function AgentAvatar({ agent, size, accent }: { agent: AgentDoc; size: number; accent: string }) {
  return (
    <div
      className="relative rounded-full overflow-hidden flex items-center justify-center font-display font-bold shrink-0 border-2"
      style={{ width: size, height: size, backgroundColor: accent, borderColor: accent, color: "#111", fontSize: size / 2.4 }}
    >
      {agent.photoUrl ? <Image src={agent.photoUrl} alt={agent.displayName} fill className="object-cover" sizes={`${size}px`} priority /> : agent.displayName.charAt(0)}
    </div>
  );
}

function AgentLogo({ agent, className }: { agent: AgentDoc; className: string }) {
  if (!agent.logoUrl) return null;
  // Logos are often dark on white, so they sit on a white tile.
  return (
    <div className={`relative bg-white rounded-lg p-1.5 shrink-0 ${className}`}>
      <div className="relative w-full h-full">
        <Image src={agent.logoUrl} alt={`${agent.agencyName || agent.displayName} logo`} fill className="object-contain" sizes="96px" />
      </div>
    </div>
  );
}

export function AgentHeader({ agent, verified, pro }: { agent: AgentDoc; verified: boolean; pro: boolean }) {
  const theme = agentTheme(agent);
  const phone = waNumber(agent.whatsapp);
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${agent.displayName}, I saw your properties page. I'm looking for a property.`)}`;
  const cover = pro && agent.coverUrl ? agent.coverUrl : null;
  return (
    <header className="relative overflow-hidden" style={theme.style}>
      {cover && (
        <>
          <Image src={cover} alt="" fill className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${theme.bg}99 0%, ${theme.bg}F2 70%)` }} />
        </>
      )}
      <div className={`relative container mx-auto px-4 max-w-6xl ${cover ? "pt-24 md:pt-32" : "pt-6 md:pt-8"} pb-6 md:pb-8 flex flex-col md:flex-row md:items-center gap-5`}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <AgentAvatar agent={agent} size={72} accent={theme.accent} />
          <div className="min-w-0 space-y-1 flex-1">
            <h1 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
              <span className="truncate">{agent.displayName}</span>
              {verified && <BadgeCheck className="w-5 h-5 shrink-0" style={{ color: theme.accent }} aria-label="Verified agent" />}
            </h1>
            {agent.agencyName && <p className="text-sm font-semibold truncate" style={{ color: theme.accent }}>{agent.agencyName}</p>}
            {agent.tagline && <p className="text-sm text-white/90">{agent.tagline}</p>}
            <p className="text-xs text-white/80 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {agent.city}</span>
              {!!agent.languages?.length && <span className="inline-flex items-center gap-1"><Languages className="w-3.5 h-3.5" /> {agent.languages.join(", ")}</span>}
              {agent.reraNumber && <span>RERA {agent.reraNumber}</span>}
            </p>
          </div>
          <AgentLogo agent={agent} className="w-16 h-16 md:w-20 md:h-20" />
        </div>
        <div className="grid grid-cols-2 gap-2 md:w-72">
          <TapLink kind="wa" agentId={agent.id} href={wa} target="_blank" rel="noopener noreferrer" className="h-11 rounded-btn bg-[#25D366] text-[#0B3B1E] font-bold text-sm inline-flex items-center justify-center gap-2">
            <FaWhatsapp className="w-4 h-4" /> WhatsApp
          </TapLink>
          <TapLink kind="call" agentId={agent.id} href={`tel:+${phone}`} className="h-11 rounded-btn font-bold text-sm inline-flex items-center justify-center gap-2" style={{ backgroundColor: theme.accent, color: theme.bg }}>
            <Phone className="w-4 h-4" /> Call
          </TapLink>
        </div>
      </div>
      {agent.bio && (
        <div className="relative container mx-auto px-4 max-w-6xl pb-6">
          <p className="text-sm text-white/85 max-w-3xl">{agent.bio}</p>
        </div>
      )}
    </header>
  );
}

const SOCIAL = [
  { key: "website", label: "Website", icon: Globe },
  { key: "facebook", label: "Facebook", icon: FaFacebook },
  { key: "instagram", label: "Instagram", icon: FaInstagram },
  { key: "youtube", label: "YouTube", icon: FaYoutube },
] as const;

/** Office, languages and social links at the foot of every agent page. */
export function AgentContactCard({ agent }: { agent: AgentDoc }) {
  const theme = agentTheme(agent);
  const links = SOCIAL.filter((s) => agent.social?.[s.key]);
  const phone = waNumber(agent.whatsapp);
  return (
    <section className="border-t border-black/10" style={theme.style} aria-label={`Contact ${agent.displayName}`}>
      <div className="container mx-auto px-4 max-w-6xl py-8 grid gap-6 md:grid-cols-3 text-sm">
        <div className="flex items-center gap-3">
          <AgentLogo agent={agent} className="w-14 h-14" />
          <div className="min-w-0">
            <p className="font-display font-bold text-base truncate">{agent.agencyName || agent.displayName}</p>
            {agent.agencyName && <p className="text-white/80 truncate">{agent.displayName}</p>}
          </div>
        </div>
        <div className="space-y-1.5 text-white/85">
          {agent.officeAddress && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(agent.officeAddress)}`} target="_blank" rel="noopener noreferrer" className="flex gap-2 hover:underline">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" /> <span>{agent.officeAddress}</span>
            </a>
          )}
          <a href={`tel:+${phone}`} className="flex gap-2 hover:underline"><Phone className="w-4 h-4 shrink-0 mt-0.5" /> +{phone}</a>
          {agent.reraNumber && <p>RERA {agent.reraNumber}</p>}
        </div>
        {links.length > 0 && (
          <ul className="flex flex-wrap gap-2 md:justify-end items-start">
            {links.map((s) => (
              <li key={s.key}>
                <a href={agent.social![s.key]} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 px-3 items-center gap-2 rounded-btn border border-white/30 hover:bg-white/10">
                  <s.icon className="w-4 h-4" /> {s.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Thin branded bar above a single listing, back to the agent's page. */
export function AgentTopBar({ agent }: { agent: AgentDoc }) {
  const theme = agentTheme(agent);
  return (
    <div style={theme.style}>
      <div className="container mx-auto px-4 max-w-7xl h-14 flex items-center justify-between gap-3 text-sm">
        <Link href={`/a/${agent.slug}`} className="font-semibold hover:underline inline-flex items-center gap-2 min-w-0" style={{ color: theme.accent }}>
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="truncate">All properties from {agent.agencyName || agent.displayName}</span>
        </Link>
        <AgentLogo agent={agent} className="w-10 h-10" />
      </div>
    </div>
  );
}

// The page is cached for every visitor, so it can't know who is looking; the
// agent gets a link to the dashboard, which says exactly why (email or plan).
export function AgentPaused({ agent }: { agent: AgentDoc }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-warm-cream px-4">
      <div className="max-w-md text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-navy-900">{agent.displayName}&apos;s page is paused</h1>
        <p className="text-sm text-navy-700">This page isn&apos;t available right now. Please contact the agent directly, or browse other properties.</p>
        <Link href="/properties" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">Browse properties</Link>
        <p className="text-xs text-navy-600 pt-4">
          Is this your page? <Link href="/dashboard" className="underline font-semibold">Open your dashboard</Link> to see why it&apos;s paused.
        </p>
      </div>
    </div>
  );
}

export function PoweredBy({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <footer className="py-6 text-center text-xs text-navy-600 bg-warm-cream border-t border-[#E4DED2]">
      Page made with <Link href="/for-agents" className="underline font-semibold text-navy-800">{BRAND.name}</Link> — get your own property page.
    </footer>
  );
}
