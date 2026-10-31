"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EnquiryForm } from "@/components/property/EnquiryForm";

export function StickyEnquiryBar({
  propertyId,
  phone,
  whatsappUrl,
  source,
  privacyNote,
}: {
  propertyId: string;
  phone: string;
  whatsappUrl: string;
  source: "WEB" | "AGENT_PAGE";
  privacyNote: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E4DED2] px-3 py-3 z-40 pb-safe flex gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-btn flex items-center justify-center h-12 shadow-sm">
          <FaWhatsapp className="w-5 h-5" />
        </a>
        <a href={`tel:+${phone}`} aria-label="Call" className="flex-1 bg-gold-600 hover:bg-gold-700 text-white rounded-btn flex items-center justify-center h-12 shadow-sm">
          <Phone className="w-5 h-5" />
        </a>
        <Button onClick={() => setIsOpen(true)} className="flex-[2] bg-navy-900 hover:bg-navy-800 text-white font-sans font-bold text-sm h-12 shadow-sm rounded-btn flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" /> Enquire now
        </Button>
      </div>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Interested in this property?">
        <div className="py-2">
          <EnquiryForm propertyId={propertyId} source={source} privacyNote={privacyNote} idPrefix="sheet" />
        </div>
      </BottomSheet>
    </>
  );
}
