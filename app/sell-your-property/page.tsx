import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Phone, MessageCircle } from "lucide-react";

export const metadata = {
  title: "List Your Property | DK Promoters",
  description:
    "Sell or rent your property fast in Tamil Nadu. DK Promoters handles every buyer enquiry — your contact stays private.",
};

const BENEFITS = [
  {
    title: "Broker-Managed Listing",
    description: "We personally handle your listing, photos, and pricing. No hassle for you.",
  },
  {
    title: "Broker-Verified Buyers",
    description:
      "Every buyer enquiry is vetted by our broker team before connecting with you.",
  },
  {
    title: "Privacy Protected",
    description:
      "Your phone number and email are never shown publicly — buyers reach us, not you directly.",
  },
  {
    title: "Dedicated Support",
    description:
      "We guide you through the entire process from listing to closing the deal.",
  },
];

const WHATSAPP_NUMBER = "916381169124";
const PHONE_NUMBER = "+916381169124";
const WHATSAPP_MSG = encodeURIComponent("Hi DK Promoters, I want to list my property. Please guide me.");

export default function SellYourPropertyPage() {
  return (
    <div className="bg-warm-cream min-h-[calc(100vh-64px)] py-10 md:py-16 px-4 pb-24 md:pb-16">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-flex items-center gap-1.5 text-gold-700 font-bold uppercase tracking-widest text-[11px] mb-3 bg-gold-500/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" /> Broker-managed listing
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-navy-900 mb-4 leading-tight">
            Sell or Rent Your Property{" "}
            <span className="text-gold-700">Faster</span>
          </h1>
          <p className="text-sm md:text-lg text-navy-700 max-w-2xl mx-auto">
            Reach genuine buyers across all 38 districts of Tamil Nadu.
            Contact DK Promoters — we handle every buyer enquiry personally.
          </p>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-card border border-[#E8E0D0] shadow-sm">
          <h2 className="text-xl md:text-2xl font-display font-bold mb-6 text-navy-900 text-center">
            Why List With DK Promoters?
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-gold-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-navy-900 text-sm sm:text-base">
                    {b.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-navy-700 mt-0.5 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[#E8E0D0] flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1DA851] text-white font-bold px-8 h-12 rounded-btn shadow-sm flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp Us
              </Button>
            </a>
            <a href={`tel:${PHONE_NUMBER}`} className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-navy-700 text-navy-800 hover:bg-navy-50 font-bold px-8 h-12 rounded-btn flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Call +91 63811 69124
              </Button>
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-navy-600 mt-6 leading-relaxed max-w-xl mx-auto">
          By contacting us, you agree that all buyer enquiries are routed
          through DK Promoters. We coordinate every conversation and protect
          your contact details.
        </p>
      </div>
    </div>
  );
}
