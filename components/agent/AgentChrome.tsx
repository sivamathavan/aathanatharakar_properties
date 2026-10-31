import { BRAND } from "@/lib/brand";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { waNumber } from "@/lib/plans";
import type { AgentDoc } from "@/types";

export function AgentHeader({ agent, showLogo, verified }: { agent: AgentDoc; showLogo: boolean; verified: boolean }) {
  const phone = waNumber(agent.whatsapp);
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${agent.displayName}, I saw your properties page. I'm looking for a property.`)}`;
  return (
    <header className="bg-navy-900 text-white">
      <div className="container mx-auto px-4 max-w-6xl py-6 md:py-8 flex flex-col md:flex-row md:items-center gap-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gold-500 text-navy-900 flex items-center justify-center font-display text-3xl font-bold shrink-0 border-2 border-gold-500">
            {agent.photoUrl ? <Image src={agent.photoUrl} alt={agent.displayName} fill className="object-cover" sizes="80px" priority /> : agent.displayName.charAt(0)}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
              <span className="truncate">{agent.displayName}</span>
              {verified && <BadgeCheck className="w-5 h-5 text-gold-500 shrink-0" aria-label="Verified agent" />}
            </h1>
            {agent.agencyName && <p className="text-sm text-gold-400 truncate">{agent.agencyName}</p>}
            <p className="text-xs text-gray-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {agent.city}
              {agent.reraNumber && <span className="ml-2">RERA {agent.reraNumber}</span>}
            </p>
          </div>
          {showLogo && agent.logoUrl && (
            <div className="relative w-20 h-14 hidden sm:block shrink-0">
              <Image src={agent.logoUrl} alt={`${agent.agencyName || agent.displayName} logo`} fill className="object-contain" sizes="80px" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:w-72">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="h-11 rounded-btn bg-[#25D366] text-white font-bold text-sm inline-flex items-center justify-center gap-2">
            <FaWhatsapp className="w-4 h-4" /> WhatsApp
          </a>
          <a href={`tel:+${phone}`} className="h-11 rounded-btn bg-gold-500 text-navy-900 font-bold text-sm inline-flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" /> Call
          </a>
        </div>
      </div>
      {agent.bio && (
        <div className="container mx-auto px-4 max-w-6xl pb-6">
          <p className="text-sm text-gray-300 max-w-3xl">{agent.bio}</p>
        </div>
      )}
    </header>
  );
}

export function AgentPaused({ agent }: { agent: AgentDoc }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-warm-cream px-4">
      <div className="max-w-md text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-navy-900">{agent.displayName}&apos;s page is paused</h1>
        <p className="text-sm text-navy-700">This page isn&apos;t available right now. Please contact the agent directly, or browse other properties.</p>
        <Link href="/properties" className="inline-flex h-10 px-4 items-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm">Browse properties</Link>
      </div>
    </div>
  );
}

export function PoweredBy() {
  return (
    <footer className="py-6 text-center text-xs text-navy-600 bg-warm-cream border-t border-[#E4DED2]">
      Page made with <Link href="/for-agents" className="underline font-semibold text-navy-800">{BRAND.name}</Link> — get your own property page.
    </footer>
  );
}
