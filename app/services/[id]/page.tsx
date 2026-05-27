import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { MapPin, Briefcase, Calendar, Globe, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VendorEnquiryForm } from "@/components/vendor/VendorEnquiryForm";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const vendor = await prisma.vendorProfile.findUnique({ where: { id: params.id } });
  
  if (!vendor) return { title: 'Vendor Not Found' };

  return {
    title: `${vendor.businessName} - ${vendor.category.replace('_', ' ')} in Tamil Nadu | Aadana Tharakar`,
  };
}

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: params.id },
    include: { user: true, portfolioMedia: true },
  });

  if (!vendor || vendor.user.accountStatus !== "ACTIVE") {
    notFound();
  }

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
          <div className="w-full lg:w-1/3">
            <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-display font-bold text-lg text-navy-900 mb-2">Contact Professional</h3>
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
