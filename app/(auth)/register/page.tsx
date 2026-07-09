import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Home, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Register | DK Promoters",
  description: "Create an account on DK Promoters.",
};

export default function RegisterSelectionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4 py-12">
      <div className="w-full max-w-4xl font-sans">
        
        {/* Header Title */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-navy-900 mb-3">
            Join DK Promoters
          </h1>
          <p className="text-base text-navy-700">
            Select your account type below to get started on your journey
          </p>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Owner Card */}
          <Card className="hover:shadow-lg transition-all border-[#E8E0D0] hover:border-gold-500 bg-white group flex flex-col rounded-card">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform border border-[#E8E0D0]/50">
                <Home className="w-6 h-6" />
              </div>
              <CardTitle className="font-display font-semibold text-lg text-navy-900">Property Owner</CardTitle>
              <CardDescription className="text-xs text-navy-750 font-sans mt-1">I want to sell or rent my property</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
              <ul className="text-xs text-navy-700 space-y-2.5 mb-6">
                <li className="flex items-center gap-2">• 100% Free listing</li>
                <li className="flex items-center gap-2">• Direct buyer inquiries</li>
                <li className="flex items-center gap-2">• Complete privacy protection</li>
              </ul>
              <Link href="/register/property-lister">
                <Button className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans font-bold rounded-btn flex items-center justify-center gap-1.5 shadow-sm">
                  Register as Owner <ArrowRight className="w-4 h-4 text-gold-500" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Agent Card */}
          <Card className="hover:shadow-lg transition-all border-[#E8E0D0] hover:border-gold-500 bg-white group flex flex-col rounded-card">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform border border-[#E8E0D0]/50">
                <User className="w-6 h-6" />
              </div>
              <CardTitle className="font-display font-semibold text-lg text-navy-900">Real Estate Agent</CardTitle>
              <CardDescription className="text-xs text-navy-750 font-sans mt-1">I am a broker or builder</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
              <ul className="text-xs text-navy-700 space-y-2.5 mb-6">
                <li className="flex items-center gap-2">• Manage multiple properties</li>
                <li className="flex items-center gap-2">• Get a professional profile</li>
                <li className="flex items-center gap-2">• Dedicated agent dashboard</li>
              </ul>
              <Link href="/register/agent">
                <Button className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans font-bold rounded-btn flex items-center justify-center gap-1.5 shadow-sm">
                  Register as Agent <ArrowRight className="w-4 h-4 text-gold-500" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Vendor Card */}
          <Card className="hover:shadow-lg transition-all border-[#E8E0D0] hover:border-gold-500 bg-white group flex flex-col rounded-card">
            <CardHeader className="text-center pb-2">
              <div className="w-14 h-14 bg-navy-50 text-gold-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform border border-[#E8E0D0]/50">
                <Briefcase className="w-6 h-6" />
              </div>
              <CardTitle className="font-display font-semibold text-lg text-navy-900">Service Professional</CardTitle>
              <CardDescription className="text-xs text-navy-750 font-sans mt-1">I provide allied services</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between pt-4">
              <ul className="text-xs text-navy-700 space-y-2.5 mb-6">
                <li className="flex items-center gap-2">• List your business profile</li>
                <li className="flex items-center gap-2">• Get direct customer leads</li>
                <li className="flex items-center gap-2">• Showcase your portfolio</li>
              </ul>
              <Link href="/register/vendor">
                <Button className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 font-sans font-bold rounded-btn flex items-center justify-center gap-1.5 shadow-sm">
                  Register as Vendor <ArrowRight className="w-4 h-4 text-gold-500" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>

        {/* Login redirect link */}
        <div className="text-center mt-12 text-navy-700 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-600 font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
