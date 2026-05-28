"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { TN_CITIES, VENDOR_CATEGORIES } from "@/lib/constants";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ChevronRight, ShieldAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VendorRegistration() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    category: "",
    experienceYears: "",
    description: "",
    operatingCities: [] as string[],
  });

  const handleCityToggle = (city: string) => {
    setFormData(prev => {
      const current = prev.operatingCities;
      return {
        ...prev,
        operatingCities: current.includes(city) 
          ? current.filter(c => c !== city)
          : [...current, city]
      };
    });
  };

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isValidPhone = (s: string) => /^[0-9+\-\s()]{7,20}$/.test(s);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Please enter your full name");
    if (!isValidEmail(formData.email)) return toast.error("Please enter a valid email");
    if (!isValidPhone(formData.phone)) return toast.error("Please enter a valid mobile number");
    if (!formData.businessName.trim()) return toast.error("Please enter your business name");
    if (!formData.category) return toast.error("Please select your service category");
    if (formData.operatingCities.length === 0) {
      return toast.error("Please select at least one operating city");
    }
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: UserRole.VENDOR,
        vendorDetails: {
          businessName: formData.businessName.trim(),
          category: formData.category,
          experienceYears: parseInt(formData.experienceYears) || 0,
          description: formData.description.trim(),
          operatingCities: formData.operatingCities,
        }
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.text();
        toast.error(error || "Registration failed");
        setLoading(false);
        return;
      }

      // Send OTP
      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (otpRes.ok) {
        toast.success("Registration submitted! Check your email for the login code.");
        setStep("otp");
      } else {
        toast.error("Registration submitted, but failed to send login code. Please try logging in manually.");
        router.push("/login");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("otp", {
        email: formData.email,
        code: otp,
        redirect: false,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Successfully logged in!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4 py-12">
      <div className="w-full max-w-2xl font-sans">
        
        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8 text-xs font-semibold text-navy-850">
          <div className="flex items-center gap-1.5 text-gold-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Account Type</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-navy-200" />
          <div className="flex items-center gap-1.5 text-navy-950 font-bold">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "form" ? "bg-navy-900 text-gold-500" : "bg-navy-100 text-navy-700"}`}>2</span>
            <span>Service Details</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-navy-200" />
          <div className="flex items-center gap-1.5 text-navy-700">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "otp" ? "bg-navy-900 text-gold-500" : "bg-navy-100 text-navy-700"}`}>3</span>
            <span>Verification</span>
          </div>
        </div>

        <Card className="w-full border-[#E8E0D0] bg-white rounded-card shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-display font-bold text-navy-900">Service Professional Registration</CardTitle>
            <CardDescription className="text-xs text-navy-750 font-sans mt-1">
              {step === "form" ? "Join Aadana Tharakar to offer your professional services" : "Enter the code sent to your email to verify your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Form grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Full Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      required 
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      required 
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Mobile Number</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      required 
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Business / Trade Name</Label>
                    <Input 
                      id="businessName" 
                      value={formData.businessName} 
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})} 
                      required 
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Service Category</Label>
                    <select 
                      id="category" 
                      className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white font-sans text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      {VENDOR_CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Years in Business</Label>
                    <Input 
                      id="experienceYears" 
                      type="number" 
                      min="0" 
                      value={formData.experienceYears} 
                      onChange={(e) => setFormData({...formData, experienceYears: e.target.value})} 
                      required 
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                    />
                  </div>
                </div>

                {/* Operating Cities selection checkbox group */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Service Areas in Tamil Nadu (Select all that apply)</Label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border border-[#E8E0D0] rounded-btn bg-[#FDF8E8]/40">
                    {TN_CITIES.map(city => (
                      <label key={city} className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-[#E8E0D0] cursor-pointer hover:bg-navy-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={formData.operatingCities.includes(city)}
                          onChange={() => handleCityToggle(city)}
                          className="rounded text-navy-900 focus:ring-gold-500"
                        />
                        <span className="text-xs font-medium text-navy-800">{city}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Business Description</Label>
                  <Textarea 
                    id="description" 
                    rows={3} 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    placeholder="Tell customers about your specialties, pricing, and history..."
                    className="border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900 text-sm font-sans"
                  />
                </div>

                <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-sm rounded-btn transition-colors" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Submitting..." : "Register & Sign In"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-sm mx-auto">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-xs font-semibold text-navy-800 uppercase tracking-wider text-center block">Enter 6-Digit Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // only numbers
                    required
                    className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900 text-center tracking-widest text-lg font-bold"
                  />
                  <p className="text-xs text-navy-600 mt-1 text-center">We sent a code to {formData.email}</p>
                </div>
                <Button type="submit" className="w-full h-11 bg-gold-500 text-navy-900 hover:bg-gold-400 font-sans font-bold rounded-btn transition-colors" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center text-xs border-t border-[#E8E0D0]/50 pt-4">
              <Link href="/register" className="text-gold-600 font-bold hover:underline">Go Back to Account Types</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
