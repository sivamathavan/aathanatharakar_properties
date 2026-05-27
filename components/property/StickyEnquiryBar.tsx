"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { MessageSquare } from "lucide-react";

export function StickyEnquiryBar({ propertyId }: { propertyId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E0D0] px-3 py-3 z-40 pb-safe flex gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <a 
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')}?text=I'm interested in property ${propertyId}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-[#25D366] hover:bg-[#128C7E] active:bg-[#128C7E] text-white rounded-btn flex items-center justify-center h-12 shadow-sm border border-transparent transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
        </a>
        <a 
          href={`tel:${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} 
          className="flex-1 bg-gold-600 hover:bg-gold-700 active:bg-gold-700 text-white rounded-btn flex items-center justify-center h-12 shadow-sm border border-transparent transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        </a>
        <Button 
          onClick={() => setIsOpen(true)}
          className="flex-[2] bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white font-sans font-bold text-sm h-12 shadow-sm rounded-btn flex items-center justify-center gap-2 border border-transparent"
        >
          <MessageSquare className="w-4 h-4" /> Enquire Now
        </Button>
      </div>

      <BottomSheet 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Interested in this property?"
      >
        <div className="py-2">
          <p className="text-xs text-gray-500 mb-4">
            Fill in your details below and our team will get in touch with you shortly.
          </p>
          <EnquiryForm propertyId={propertyId} />
        </div>
      </BottomSheet>
    </>
  );
}
