import Image from "next/image";
import { Building2, ShieldCheck, Users, Target } from "lucide-react";

export const metadata = {
  title: "About Us | DK Promoters",
  description: "Learn more about DK Promoters, Tamil Nadu's premier real estate marketplace.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      {/* Hero Section */}
      <section className="bg-navy-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-gold-500">
            About DK Promoters
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            We are Tamil Nadu's most trusted real estate marketplace, connecting buyers, sellers, and allied service professionals with transparency and ease.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-navy-900">Our Mission</h2>
            <p className="text-navy-700 leading-relaxed text-lg">
              To revolutionize the real estate experience in Tamil Nadu by providing a transparent, efficient, and user-centric platform. We aim to empower property seekers with accurate information and connect them directly with verified owners, agents, and service providers.
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-[#E8E0D0] flex-1">
                <span className="text-3xl font-bold text-gold-600 mb-1">1000+</span>
                <span className="text-xs text-navy-600 font-semibold uppercase">Happy Customers</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-[#E8E0D0] flex-1">
                <span className="text-3xl font-bold text-gold-600 mb-1">38</span>
                <span className="text-xs text-navy-600 font-semibold uppercase">Districts Covered</span>
              </div>
            </div>
          </div>
          <div className="relative h-[400px] w-full rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <Image 
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Beautiful house in Tamil Nadu"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white py-16 px-4 border-y border-[#E8E0D0]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-navy-900 text-center mb-12">Why Choose Us?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 bg-[#FDF6EC] rounded-2xl text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center mx-auto">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-navy-900 text-lg">Direct Listings</h3>
              <p className="text-sm text-navy-700">Connect directly with property owners and verified agents. No hidden middlemen.</p>
            </div>
            
            <div className="p-6 bg-[#FDF6EC] rounded-2xl text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-navy-900 text-lg">Verified Profiles</h3>
              <p className="text-sm text-navy-700">Every agent and service professional on our platform goes through an administrative review.</p>
            </div>

            <div className="p-6 bg-[#FDF6EC] rounded-2xl text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-navy-900 text-lg">Local Expertise</h3>
              <p className="text-sm text-navy-700">We specialize in Tamil Nadu real estate, bringing you the most relevant local insights.</p>
            </div>

            <div className="p-6 bg-[#FDF6EC] rounded-2xl text-center space-y-4 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-navy-900 text-lg">Allied Services</h3>
              <p className="text-sm text-navy-700">Find trusted builders, interior designers, and legal advisors all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-4 text-center bg-white border-t border-[#E8E0D0]">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-display font-bold text-navy-900">Contact Us</h2>
          <p className="text-navy-700">Have questions or need assistance? Reach out to our founder directly.</p>
          
          <div className="bg-[#FDF6EC] p-8 rounded-2xl max-w-md mx-auto text-left border border-[#E8E0D0] shadow-sm">
            <h3 className="font-bold text-navy-900 text-lg">Tamilarasan</h3>
            <p className="text-sm text-gold-600 font-semibold mb-4 uppercase tracking-wider">Founder</p>
            
            <div className="space-y-3 text-navy-800 text-sm">
              <p className="flex items-center gap-3">
                <span>📍</span> Vadavalli, Coimbatore - 641041, Tamil Nadu
              </p>
              <p className="flex items-center gap-3">
                <span>📞</span> <a href="tel:+916382987874" className="hover:text-gold-600">63829 87874</a>
              </p>
              <p className="flex items-center gap-3">
                <span>📞</span> <a href="tel:+916381169124" className="hover:text-gold-600">63811 69124</a>
              </p>
              <p className="flex items-center gap-3">
                <span>✉️</span> <a href="mailto:aadanatharakarproperty@gmail.com" className="hover:text-gold-600 break-all">aadanatharakarproperty@gmail.com</a>
              </p>
            </div>
          </div>
          
          <div className="pt-4">
            <a href="mailto:aadanatharakarproperty@gmail.com" className="inline-block px-8 py-3 bg-gold-500 text-navy-900 font-bold rounded-lg hover:bg-gold-400 transition-colors shadow-sm">
              Email Us Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
