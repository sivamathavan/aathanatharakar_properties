import { getVendorProfileById, getUserById, vendorProfilesCol } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MapPin, Briefcase, Calendar, Globe, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VendorEnquiryForm } from "@/components/vendor/VendorEnquiryForm";
import { MediaDoc } from "@/types";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const vendor = await getVendorProfileById(params.id);
  
  if (!vendor) return { title: 'Vendor Not Found' };

  return {
    title: `${vendor.businessName} - ${vendor.category.replace('_', ' ')} in Tamil Nadu | DK Promoters`,
  };
}

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const vendorData = await getVendorProfileById(params.id);
  if (!vendorData) {
    notFound();
  }

  const user = await getUserById(vendorData.userId);

  if (!user || user.accountStatus !== "ACTIVE") {
    notFound();
  }

  // Fetch portfolio media subcollection
  const mediaSnap = await vendorProfilesCol().doc(params.id).collection("media").orderBy("order").get();
  const portfolioMedia = mediaSnap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      url: data.url,
      type: data.type || "IMAGE",
      publicId: data.publicId || "unknown",
      order: data.order || 0,
    };
  });

  const vendor = {
    ...vendorData,
    user,
    portfolioMedia,
  };

  return (
    <div className="bg-warm-cream min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Vendor Header */}
        <div className="bg-navy-900 rounded-t-xl h-32 md:h-44 relative border-t border-x border-[#E8E0D0]"></div>
        <div className="bg-white rounded-b-xl shadow-sm px-6 pb-6 pt-16 relative mb-8 border-b border-x border-[#E8E0D0]">
          <div className="absolute -top-16 left-6 w-28 h-28 bg-white rounded-full p-1.5 shadow border border-[#E8E0D0]">
            <div className="w-full h-full bg-navy-50 rounded-full flex items-center justify-center text-gold-500">
               <Building2 className="w-10 h-10" />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 ml-0 md:ml-36 font-sans">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-semibold text-navy-900 mb-1">{vendor.businessName}</h1>
              <p className="text-gold-600 font-bold text-xs uppercase tracking-wider mb-2">{vendor.category.replace('_', ' ')}</p>
              <div className="flex items-center text-navy-750 text-xs">
                <MapPin className="w-3.5 h-3.5 mr-1 text-gold-500 shrink-0" />
                Operating in: {vendor.serviceAreas.join(', ')}
              </div>
            </div>
            
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-gold-500 text-navy-900 text-[10px] font-bold rounded-pill shadow-xs uppercase tracking-wide">
                Verified Partner
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Info */}
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-xs">
              <h3 className="font-display font-semibold text-base text-navy-900 mb-3">About the Business</h3>
              <p className="text-navy-800 font-sans text-sm whitespace-pre-wrap leading-relaxed">
                {vendor.description}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#E8E0D0] font-sans">
                {vendor.yearsInBusiness && (
                  <div className="flex items-center text-navy-850 text-sm">
                    <Calendar className="w-4 h-4 text-gold-600 mr-2.5 shrink-0" />
                    <span><span className="font-semibold text-navy-900">Experience:</span> {vendor.yearsInBusiness} Years</span>
                  </div>
                )}
                {vendor.websiteUrl && (
                  <div className="flex items-center text-navy-850 text-sm">
                    <Globe className="w-4 h-4 text-gold-600 mr-2.5 shrink-0" />
                    <span>
                      <span className="font-semibold text-navy-900">Website:</span>{" "}
                      <a href={vendor.websiteUrl} target="_blank" rel="noreferrer" className="text-gold-600 hover:underline font-medium break-all">
                        {vendor.websiteUrl}
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-xs font-sans">
              <h3 className="font-display font-semibold text-base text-navy-900 mb-3">Services Provided</h3>
              <ul className="list-disc pl-5 text-navy-800 text-sm space-y-2">
                <li>Professional {vendor.category.replace('_', ' ').toLowerCase()} services</li>
                <li>Consultation and planning</li>
                <li>End-to-end execution</li>
              </ul>
            </div>

            {vendor.portfolioMedia && vendor.portfolioMedia.length > 0 && (
              <div className="bg-white p-6 rounded-card border border-[#E8E0D0] shadow-xs">
                <h3 className="font-display font-semibold text-base text-navy-900 mb-4">Portfolio / Past Work</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {vendor.portfolioMedia.map((media) => (
                    <div key={media.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                      {media.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={media.url} 
                          alt="Portfolio image" 
                          className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <video 
                          src={media.url} 
                          className="object-cover w-full h-full"
                          controls
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Contact */}
          <div className="w-full lg:w-1/3 space-y-4">
            {/* Quick Contact Buttons */}
            <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm">
              <CardContent className="p-5">
                <h3 className="font-display font-bold text-base text-navy-900 mb-1">Contact Directly</h3>
                <p className="text-xs text-navy-600 font-sans mb-4">
                  Reach out to discuss your requirements instantly.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/916381169124?text=${encodeURIComponent(`Hi, I found ${vendor.businessName} on DK Promoters. I need ${vendor.category.replace('_',' ')} services. Please share more details.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-11 rounded-btn bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-bold transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href="tel:+916381169124"
                    className="flex items-center justify-center gap-2 h-11 rounded-btn bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
                    </svg>
                    Call Now
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg text-navy-900 mb-2">Send Enquiry</h3>
                <p className="text-xs text-navy-750 font-sans mb-6">
                  Send a message to {vendor.businessName} to discuss your requirements, schedule a consultation, or request a quote.
                </p>
                
                <VendorEnquiryForm vendorId={vendor.id} />
                
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
