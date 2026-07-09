import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MapPin, Bed, Bath, Layers, Square, Share2, Calendar, ShieldCheck, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnquiryForm } from "@/components/property/EnquiryForm";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { StickyEnquiryBar } from "@/components/property/StickyEnquiryBar";
import { ViewPing } from "@/components/property/ViewPing";
import { SITE_URL } from "@/lib/site";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const property = await prisma.property.findUnique({ 
    where: { id: params.id },
    include: { media: { orderBy: { order: 'asc' }, take: 1 } }
  });
  
  if (!property) return { title: 'Property Not Found' };

  const title = `${property.bedrooms ? property.bedrooms + 'BHK ' : ''}${property.type.replace('_', ' ')} for ${property.listingType} in ${property.locality}, ${property.city} — ₹${Number(property.price).toLocaleString('en-IN')} | DK Promoters`;
  const description = property.description.substring(0, 160) + (property.description.length > 160 ? "..." : "");
  
  const ogImage =
    property.media && property.media.length > 0
      ? property.media[0].url
      : `${SITE_URL}/icons/icon.svg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/properties/${property.id}`,
      siteName: "DK Promoters",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

import { SharePropertyButton } from "@/components/property/SharePropertyButton";
import { EmiCalculator } from "@/components/property/EmiCalculator";

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: { media: true },
  });

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwner = session?.user?.id && property?.postedById === session.user.id;

  if (!property || (property.status !== "ACTIVE" && !isAdmin && !isOwner)) {
    notFound();
  }

  // View count is incremented client-side via <ViewPing /> below, so we
  // don't double-count refreshes and bot traffic.

  const priceFormatted = new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumSignificantDigits: 3 
  }).format(Number(property.price));

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const addressQuery = encodeURIComponent(`${property.address}, ${property.city}, Tamil Nadu`);

  const mediaItems = property.media.map(m => ({
    id: m.id,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl,
    type: m.type as "IMAGE" | "VIDEO"
  }));

  const getListingBadgeClass = (type: string) => {
    switch(type) {
      case 'BUY': return 'bg-gold-500 text-navy-900 border-gold-600';
      case 'RENT': return 'bg-navy-700 text-white';
      case 'LEASE': return 'bg-purple-600 text-white';
      case 'SELL': return 'bg-navy-600 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, "") || "916381169124";
  const whatsappMessage = encodeURIComponent(`Hi, I'm interested in "${property.title}" (ID: ${property.id}) on DK Promoters. Please share more details.`);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;
  const propertyUrl = `${SITE_URL}/properties/${property.id}`;

  return (
    <div className="bg-warm-cream min-h-screen py-6 md:py-10 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Breadcrumb / Navigation helper */}
        <div className="mb-4 text-xs font-sans text-navy-700 flex items-center gap-2">
          <a href="/" className="hover:underline hover:text-gold-600">Home</a>
          <span>/</span>
          <a href="/properties" className="hover:underline hover:text-gold-600">Properties</a>
          <span>/</span>
          <span className="text-navy-900 font-medium truncate max-w-xs">{property.title}</span>
        </div>

        {/* Gallery Section */}
        <div className="mb-6 md:mb-8">
          <PropertyGallery media={mediaItems} title={property.title} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Info */}
          <div className="w-full lg:w-2/3 space-y-6 md:space-y-8">
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div>
                  <div className={`inline-block px-3 py-1 text-[10px] font-bold rounded-pill mb-3 uppercase tracking-wider ${getListingBadgeClass(property.listingType)}`}>
                    For {property.listingType === 'BUY' ? 'Sale' : property.listingType}
                  </div>
                  <h1 className="text-xl md:text-2xl font-display font-semibold text-navy-900 leading-snug">{property.title}</h1>
                  <p className="text-navy-700 text-xs font-sans mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gold-500 shrink-0" /> {property.address}, {property.city}</p>
                </div>
                <div className="sm:text-right shrink-0">
                  <div className="text-2xl md:text-3xl font-display font-bold text-navy-900">{priceFormatted}</div>
                  <div className="text-xs text-navy-700 font-sans mt-0.5 uppercase tracking-wider">{property.priceUnit.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Property Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-y border-[#E8E0D0] my-6 font-sans">
                <div className="flex items-center gap-3 bg-warm-cream/50 p-3 rounded-btn border border-[#E8E0D0]/30">
                  <Square className="w-5 h-5 text-gold-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-navy-750 uppercase font-semibold">Area</div>
                    <div className="font-bold text-sm text-navy-900">{property.area} Sq.Ft</div>
                  </div>
                </div>
                {property.bedrooms && (
                  <div className="flex items-center gap-3 bg-warm-cream/50 p-3 rounded-btn border border-[#E8E0D0]/30">
                    <Bed className="w-5 h-5 text-gold-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-navy-750 uppercase font-semibold">Bedrooms</div>
                      <div className="font-bold text-sm text-navy-900">{property.bedrooms} BHK</div>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-3 bg-warm-cream/50 p-3 rounded-btn border border-[#E8E0D0]/30">
                    <Bath className="w-5 h-5 text-gold-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-navy-750 uppercase font-semibold">Bathrooms</div>
                      <div className="font-bold text-sm text-navy-900">{property.bathrooms}</div>
                    </div>
                  </div>
                )}
                {property.floors && (
                  <div className="flex items-center gap-3 bg-warm-cream/50 p-3 rounded-btn border border-[#E8E0D0]/30">
                    <Layers className="w-5 h-5 text-gold-600 shrink-0" />
                    <div>
                      <div className="text-[10px] text-navy-750 uppercase font-semibold">Floors</div>
                      <div className="font-bold text-sm text-navy-900">{property.floors}</div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-display font-semibold text-navy-900 mb-3">Description</h3>
                <p className="text-navy-800 font-sans text-sm whitespace-pre-wrap leading-relaxed">
                  {property.description}
                </p>
              </div>
            </div>

            {/* Amenities Section */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-xs">
                <h3 className="text-base font-display font-semibold text-navy-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map(amenity => (
                    <div key={amenity} className="flex items-center text-navy-800 text-sm font-sans">
                      <span className="w-1.5 h-1.5 bg-[#D4A017] rounded-full mr-2.5 shrink-0"></span>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Map */}
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-xs">
              <h3 className="text-base font-display font-semibold text-navy-900 mb-4">Location Map</h3>
              <div className="w-full h-80 bg-navy-50 rounded-lg overflow-hidden border border-[#E8E0D0]">
                {mapsApiKey ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${property.latitude && property.longitude ? `${property.latitude},${property.longitude}` : addressQuery}`}
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-sans">
                    Google Maps location placeholder for: {property.address}, {property.city}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile-only: EMI + Share + Site visit (sidebar features
              that would otherwise be hidden below 1024px). The
              StickyEnquiryBar at the bottom handles the main CTA. */}
          <div className="lg:hidden space-y-4">
            {/* Quick broker contact — primary action on mobile */}
            <div className="bg-white p-5 rounded-card border border-[#E8E0D0] shadow-xs space-y-3">
              <h3 className="font-display font-bold text-base text-navy-900">
                Contact our broker
              </h3>
              <p className="text-xs text-navy-700 leading-relaxed">
                DK Promoters handles every conversation — your details stay private.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#1ebe5c] active:bg-[#128C7E] text-white h-12 text-xs font-bold rounded-btn flex items-center justify-center gap-2 shadow-sm transition-colors"
                  aria-label="Contact broker on WhatsApp"
                >
                  <FaWhatsapp className="w-4 h-4" /> WhatsApp
                </a>
                <a
                  href={`tel:+${whatsappNumber}`}
                  className="w-full bg-navy-900 hover:bg-navy-950 active:bg-black text-gold-500 h-12 text-xs font-bold rounded-btn flex items-center justify-center gap-2 shadow-sm transition-colors"
                  aria-label="Call broker"
                >
                  <Phone className="w-4 h-4" /> Call Broker
                </a>
              </div>
            </div>

            <EmiCalculator propertyPrice={Number(property.price)} />

            <div className="bg-white p-5 rounded-card border border-[#E8E0D0] shadow-xs space-y-3">
              <h3 className="font-display font-bold text-base text-navy-900">More options</h3>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full border border-navy-700 text-navy-800 hover:bg-navy-50 h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4 text-gold-500" /> Book Free Site Visit via Broker
              </a>
              <SharePropertyButton title={property.title} url={propertyUrl} />
              <div className="p-3 bg-navy-50 rounded-btn border border-navy-100 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-navy-800 leading-normal font-medium">
                  Your data is secure. All enquiries go through DK Promoters — owner contact is never shared publicly.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Sidebar (Hidden on Mobile screens < 1024px) */}
          <div className="hidden lg:block lg:w-1/3 space-y-6">
            <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg text-navy-900 mb-2">Interested in this property?</h3>
                <p className="text-xs text-navy-700 font-sans mb-6">
                  Submit an enquiry and our dedicated team will reach out to you within 24 hours to organize a site visit.
                </p>
                
                <EnquiryForm propertyId={property.id} />
                
                <div className="mt-6 pt-5 border-t border-[#E8E0D0] flex flex-col gap-3 font-sans">
                  <Button variant="outline" className="w-full border-navy-700 text-navy-800 hover:bg-navy-50 h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-gold-500" /> Book Free Site Visit
                  </Button>
                  <div className="flex gap-2">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-1/2">
                      <Button variant="default" className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2 shadow-sm border-none">
                        <FaWhatsapp className="w-4 h-4" /> WhatsApp
                      </Button>
                    </a>
                    <a href={`tel:${whatsappNumber}`} className="w-1/2">
                      <Button variant="default" className="w-full bg-gold-600 hover:bg-gold-700 text-white h-11 text-xs font-bold rounded-btn flex items-center justify-center gap-2 shadow-sm border-none">
                        📞 Call Now
                      </Button>
                    </a>
                  </div>
                  <SharePropertyButton title={property.title} url={propertyUrl} />
                  <div className="mt-3 p-3 bg-navy-50 rounded-btn border border-navy-100 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-navy-800 leading-normal font-medium">
                      Your data is secure. We never share your details or show public phone numbers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EMI Calculator */}
            <EmiCalculator propertyPrice={Number(property.price)} />
          </div>

        </div>
      </div>

      {/* Floating Bottom Sticky Bar on Mobile (with Safe bottom padding) */}
      <StickyEnquiryBar propertyId={property.id} />
      <ViewPing propertyId={property.id} />
    </div>
  );
}
