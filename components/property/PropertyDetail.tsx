import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Layers, Square, Calendar, ShieldCheck, Phone, Route, BadgeCheck } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Card, CardContent } from "@/components/ui/card";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { StickyEnquiryBar } from "@/components/property/StickyEnquiryBar";
import { ViewPing } from "@/components/property/ViewPing";
import { SharePropertyButton } from "@/components/property/SharePropertyButton";
import { EmiCalculator } from "@/components/property/EmiCalculator";
import { TapLink } from "@/components/agent/TapLink";
import type { PropertyDoc } from "@/types";
import { serverT } from "@/lib/i18n/server";

export interface DetailContact {
  name: string;
  subtitle: string;
  phone: string; // digits, wa.me format
  photoUrl?: string | null;
  verified?: boolean;
  agentId?: string; // counts WhatsApp/call/share taps for the agent's stats
}

const AREA_LABEL: Record<string, string> = { SQFT: "Sq.Ft", CENT: "Cents", ACRE: "Acres", GROUND: "Grounds" };

function listingBadge(type: string, t: (k: string) => string) {
  switch (type) {
    case "BUY":
      return { label: t("For Sale"), cls: "bg-gold-500 text-navy-900" };
    case "RENT":
      return { label: t("For Rent"), cls: "bg-navy-700 text-white" };
    case "LEASE":
      return { label: t("For Lease"), cls: "bg-purple-600 text-white" };
    default:
      return { label: t("For Sale"), cls: "bg-navy-600 text-white" };
  }
}

// One property page used by the main site and by every agent's share link.
// Only the contact (who gets the call) and the breadcrumbs differ.
export function PropertyDetail({
  property,
  contact,
  source,
  shareUrl,
  breadcrumbs,
  privacyNote,
}: {
  property: PropertyDoc;
  contact: DetailContact;
  source: "WEB" | "AGENT_PAGE";
  shareUrl: string;
  breadcrumbs: { label: string; href: string }[];
  privacyNote: string;
}) {
  const t = serverT();
  const price = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumSignificantDigits: 3 }).format(Number(property.price));
  const badge = listingBadge(property.listingType, t);
  const waText = encodeURIComponent(`Hi ${contact.name}, I'm interested in "${property.title}" (${shareUrl}). Please share more details.`);
  const whatsappUrl = `https://wa.me/${contact.phone}?text=${waText}`;
  const visitUrl = `https://wa.me/${contact.phone}?text=${encodeURIComponent(`Hi ${contact.name}, I'd like to book a site visit for "${property.title}" (${shareUrl}).`)}`;
  const mapsHref =
    property.mapsLink ||
    (property.latitude && property.longitude
      ? `https://www.google.com/maps?q=${property.latitude},${property.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${property.locality}, ${property.city}, Tamil Nadu`)}`);
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mediaItems = (property.media || []).map((m, i) => ({ id: `${i}`, url: m.url, type: m.type }));
  const areaLabel = AREA_LABEL[property.areaUnit || "SQFT"] || "Sq.Ft";

  const facts = [
    { icon: Square, label: t("Area"), value: `${property.area} ${areaLabel}` },
    property.bedrooms ? { icon: Bed, label: t("Bedrooms"), value: `${property.bedrooms} BHK` } : null,
    property.bathrooms ? { icon: Bath, label: t("Bathrooms"), value: `${property.bathrooms}` } : null,
    property.floors ? { icon: Layers, label: t("Floors"), value: `${property.floors}` } : null,
    property.roadFacing ? { icon: Route, label: t("Road"), value: property.roadFacing } : null,
  ].filter(Boolean) as { icon: typeof Square; label: string; value: string }[];

  const contactCard = (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-navy-900 text-gold-500 flex items-center justify-center font-display font-bold text-lg overflow-hidden shrink-0 relative">
        {contact.photoUrl ? <Image src={contact.photoUrl} alt={contact.name} fill className="object-cover" sizes="48px" /> : contact.name.charAt(0)}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-navy-900 text-sm flex items-center gap-1">
          {contact.name}
          {contact.verified && <BadgeCheck className="w-4 h-4 text-gold-600" aria-label="Verified agent" />}
        </p>
        <p className="text-xs text-navy-700 truncate">{contact.subtitle}</p>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="grid grid-cols-2 gap-2">
      <TapLink kind="wa" agentId={contact.agentId || ""} propertyId={property.id} href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] hover:bg-[#1ebe5c] text-[#0B3B1E] h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2 shadow-sm">
        <FaWhatsapp className="w-4 h-4" /> WhatsApp
      </TapLink>
      <TapLink kind="call" agentId={contact.agentId || ""} propertyId={property.id} href={`tel:+${contact.phone}`} className="bg-navy-900 hover:bg-navy-950 text-gold-500 h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2 shadow-sm">
        <Phone className="w-4 h-4" /> {t("Call")}
      </TapLink>
    </div>
  );

  return (
    <div className="bg-warm-cream min-h-screen py-6 md:py-10 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <nav className="mb-4 text-xs font-sans text-navy-700 flex items-center gap-2 flex-wrap" aria-label="Breadcrumb">
          {breadcrumbs.map((b) => (
            <span key={b.href} className="flex items-center gap-2">
              <Link href={b.href} className="hover:underline hover:text-gold-600">{b.label}</Link>
              <span>/</span>
            </span>
          ))}
          <span className="text-navy-900 font-medium truncate max-w-xs">{property.title}</span>
        </nav>

        <div className="mb-6 md:mb-8">
          <PropertyGallery media={mediaItems} title={property.title} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 space-y-6 md:space-y-8">
            <div className="bg-white p-6 rounded-card border border-[#E4DED2] shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="min-w-0">
                  <div className={`inline-block px-3 py-1 text-[10px] font-bold rounded-pill mb-3 uppercase tracking-wider ${badge.cls}`}>{badge.label}</div>
                  <h1 className="text-xl md:text-2xl font-display font-semibold text-navy-900 leading-snug">{property.title}</h1>
                  <p className="text-navy-700 text-xs font-sans mt-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" /> {property.locality}, {property.city}
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="text-2xl md:text-3xl font-display font-bold text-navy-900">{price}</div>
                  <div className="text-xs text-navy-700 font-sans mt-0.5 uppercase tracking-wider">{property.priceUnit.replace("_", " ")}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-[#E4DED2] my-6 font-sans">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-center gap-3 bg-warm-cream/50 p-3 rounded-btn border border-[#E4DED2]/30">
                    <f.icon className="w-5 h-5 text-gold-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-navy-750 uppercase font-semibold">{f.label}</div>
                      <div className="font-bold text-sm text-navy-900">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="text-base font-display font-semibold text-navy-900 mb-3">{t("Description")}</h2>
              <p className="text-navy-800 font-sans text-sm whitespace-pre-wrap leading-relaxed">{property.description}</p>
            </div>

            {property.amenities?.length > 0 && (
              <div className="bg-white p-6 rounded-card border border-[#E4DED2] shadow-xs">
                <h2 className="text-base font-display font-semibold text-navy-900 mb-4">{t("Amenities")}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((a) => (
                    <div key={a} className="flex items-center text-navy-800 text-sm font-sans">
                      <span className="w-1.5 h-1.5 bg-[#E39614] rounded-full mr-2.5 shrink-0"></span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-card border border-[#E4DED2] shadow-xs space-y-4">
              <h2 className="text-base font-display font-semibold text-navy-900">{t("Location")}</h2>
              {mapsApiKey && property.latitude && property.longitude ? (
                <div className="w-full h-80 bg-navy-50 rounded-lg overflow-hidden border border-[#E4DED2]">
                  <iframe title="Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${property.latitude},${property.longitude}`}></iframe>
                </div>
              ) : null}
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-900 underline underline-offset-4">
                <MapPin className="w-4 h-4 text-gold-600" /> {t("Open in Google Maps")}
              </a>
            </div>
          </div>

          {/* Mobile: contact, EMI, share. The sticky bar carries the main action. */}
          <div className="lg:hidden space-y-4">
            <div className="bg-white p-5 rounded-card border border-[#E4DED2] shadow-xs space-y-4">
              {contactCard}
              {actionButtons}
              <a href={visitUrl} target="_blank" rel="noopener noreferrer" className="w-full border border-navy-700 text-navy-800 hover:bg-navy-50 h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-gold-500" /> {t("Book a site visit")}
              </a>
              <SharePropertyButton title={property.title} url={shareUrl} agentId={contact.agentId} propertyId={property.id} />
            </div>
            <EmiCalculator propertyPrice={Number(property.price)} />
          </div>

          <div className="hidden lg:block lg:w-1/3 space-y-6">
            <Card className="border-[#E4DED2] bg-white rounded-card shadow-sm sticky top-24">
              <CardContent className="p-6 space-y-5">
                {contactCard}
                {actionButtons}
                <div className="border-t border-[#E4DED2] pt-5">
                  <h2 className="font-display font-bold text-base text-navy-900 mb-3">{t("Send an enquiry")}</h2>
                  <EnquiryForm propertyId={property.id} source={source} privacyNote={privacyNote} idPrefix="side" />
                </div>
                <div className="flex flex-col gap-3">
                  <a href={visitUrl} target="_blank" rel="noopener noreferrer" className="w-full border border-navy-700 text-navy-800 hover:bg-navy-50 h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-gold-500" /> {t("Book a site visit")}
                  </a>
                  <SharePropertyButton title={property.title} url={shareUrl} agentId={contact.agentId} propertyId={property.id} />
                  <div className="p-3 bg-navy-50 rounded-btn border border-navy-100 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-navy-800 leading-normal font-medium">{privacyNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <EmiCalculator propertyPrice={Number(property.price)} />
          </div>
        </div>
      </div>

      <StickyEnquiryBar agentId={contact.agentId} propertyId={property.id} phone={contact.phone} whatsappUrl={whatsappUrl} source={source} privacyNote={privacyNote} />
      <ViewPing propertyId={property.id} />
    </div>
  );
}
