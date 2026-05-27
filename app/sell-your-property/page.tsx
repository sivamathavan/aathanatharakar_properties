import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "List Your Property Free | Aadana Tharakar",
  description: "Sell or rent your property fast in Tamil Nadu.",
};

export default function SellYourPropertyPage() {
  return (
    <div className="bg-[#FDF6EC] min-h-[calc(100vh-64px)] py-16 flex flex-col items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6">
          Sell or Rent Your Property <span className="text-[#E85D24]">Faster</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Reach thousands of genuine buyers and tenants across all 38 districts of Tamil Nadu. List your property for free on Aadana Tharakar today.
        </p>
        
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold mb-8 text-[#1D6A3A]">Why List With Us?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
            <div className="flex items-start">
              <CheckCircle2 className="w-6 h-6 text-[#E85D24] mr-3 shrink-0" />
              <div>
                <h4 className="font-bold text-[#1A1A1A]">100% Free Listing</h4>
                <p className="text-sm text-gray-500">No hidden charges or premium fees to list your property.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-6 h-6 text-[#E85D24] mr-3 shrink-0" />
              <div>
                <h4 className="font-bold text-[#1A1A1A]">Verified Leads</h4>
                <p className="text-sm text-gray-500">We verify phone numbers to ensure you only get genuine enquiries.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-6 h-6 text-[#E85D24] mr-3 shrink-0" />
              <div>
                <h4 className="font-bold text-[#1A1A1A]">Privacy Protected</h4>
                <p className="text-sm text-gray-500">Your phone number is never shown publicly to prevent spam.</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle2 className="w-6 h-6 text-[#E85D24] mr-3 shrink-0" />
              <div>
                <h4 className="font-bold text-[#1A1A1A]">Dedicated Support</h4>
                <p className="text-sm text-gray-500">Our team helps you create an attractive listing with great photos.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register/property-lister">
              <Button size="lg" className="w-full sm:w-auto bg-[#E85D24] hover:bg-[#d6521e] text-white px-8">
                Create Free Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-[#1D6A3A] text-[#1D6A3A] hover:bg-green-50 px-8">
                Login to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
