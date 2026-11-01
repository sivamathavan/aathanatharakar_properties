import { Mail } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { BRAND } from "@/lib/brand";

/**
 * How to reach the PropPage team. Reads NEXT_PUBLIC_SUPPORT_EMAIL and
 * NEXT_PUBLIC_SUPPORT_WHATSAPP (lib/brand.ts); shows nothing while both are blank.
 */
export function SupportLinks({ message, className = "" }: { message?: string; className?: string }) {
  if (!BRAND.supportEmail && !BRAND.supportWhatsapp) return null;
  const text = encodeURIComponent(message || `Hi ${BRAND.name} team, I need help with my account.`);
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {BRAND.supportWhatsapp && (
        <a href={`https://wa.me/${BRAND.supportWhatsapp}?text=${text}`} target="_blank" rel="noopener noreferrer" className="h-10 px-3 inline-flex items-center gap-2 rounded-btn bg-[#25D366] text-[#0B3B1E] text-sm font-semibold">
          <FaWhatsapp className="w-4 h-4" /> WhatsApp {BRAND.name}
        </a>
      )}
      {BRAND.supportEmail && (
        <a href={`mailto:${BRAND.supportEmail}`} className="h-10 px-3 inline-flex items-center gap-2 rounded-btn border border-navy-300 text-navy-900 text-sm font-semibold break-all">
          <Mail className="w-4 h-4 shrink-0" /> {BRAND.supportEmail}
        </a>
      )}
    </div>
  );
}

export const hasSupport = () => !!(BRAND.supportEmail || BRAND.supportWhatsapp);
