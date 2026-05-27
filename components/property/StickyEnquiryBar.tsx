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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E0D0] px-4 py-3 z-40 pb-safe flex gap-2">
        <Button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-gold-500 hover:bg-gold-400 active:bg-gold-600 text-navy-900 font-sans font-bold py-3 text-sm h-12 shadow-md rounded-btn flex items-center justify-center gap-2"
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
