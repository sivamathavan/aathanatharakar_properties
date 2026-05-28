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
import { TN_CITIES } from "@/lib/constants";
import { CheckCircle2, ChevronRight, ShieldAlert, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AgentRegistration() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    agencyName: "",
    officeAddress: "",
    experienceYears: "",
    reraNumber: "",
    operatingCities: [] as string[],
  });

  const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const isValidPhone = (s: string) => /^[0-9+\-\s()]{7,20}$/.test(s);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Please enter your full name");
    if (!isValidEmail(formData.email)) return toast.error("Please enter a valid email");
    if (!isValidPhone(formData.phone)) return toast.error("Please enter a valid mobile number");
    if (!formData.agencyName.trim()) return toast.error("Please enter your agency / company name");
    if (formData.operatingCities.length === 0) {
      return toast.error("Please select at least one operating city");
    }
    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        role: UserRole.AGENT,
        agentDetails: {
          // Schema stores officeAddress; combine agency + address into a single field.
          officeAddress: [formData.agencyName.trim(), formData.officeAddress.trim()]
            .filter(Boolean)
            .join(" — "),
          experienceYears: parseInt(formData.experienceYears) || 0,
          reraNumber: formData.reraNumber.trim(),
          operatingCities: formData.operatingCities,
        },
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
            <span>Agent Profile</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-navy-200" />
          <div className="flex items-center gap-1.5 text-navy-700">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === "otp" ? "bg-navy-900 text-gold-500" : "bg-navy-100 text-navy-700"}`}>3</span>
            <span>Verification</span>
          </div>
        </div>

        <Card className="w-full border-[#E8E0D0] bg-white rounded-card shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-display font-bold text-navy-900">Agent & Broker Registration</CardTitle>
            <CardDescription className="text-xs text-navy-750 font-sans mt-1">
              {step === "form" ? "Join Aadana Tharakar as a verified local property professional" : "Enter the code sent to your email to verify your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Form Grid */}
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
                    <Label htmlFor="agencyName" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Agency / Company Name</Label>
                    <Input 
                      id="agencyName" 
                      value={formData.agencyName} 
                      onChange={(e) => setFormData({...formData, agencyName: e.target.value})} 
                      required 
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienceYears" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Years of Experience</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="reraNumber" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">RERA Registration Number (Optional)</Label>
                    <Input
                      id="reraNumber"
                      value={formData.reraNumber}
                      onChange={(e) => setFormData({...formData, reraNumber: e.target.value})}
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                      placeholder="e.g. TN/01/Agent/..."
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="officeAddress" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Office Address</Label>
                    <Input
                      id="officeAddress"
                      value={formData.officeAddress}
                      onChange={(e) => setFormData({...formData, officeAddress: e.target.value})}
                      className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
                      placeholder="Street, Locality, City"
                    />
                  </div>
                </div>

                {/* Operating Cities selection checkbox group */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Operating Cities in Tamil Nadu (Select all that apply)</Label>
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

                <div className="bg-navy-50 border border-navy-100 rounded-btn p-3 flex items-start gap-2 text-[11px] leading-relaxed text-navy-800">
                  <ShieldAlert className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                  <span>
                    Agent accounts are reviewed by our broker team before going live.
                    You can log in and prepare your profile while approval is pending.
                  </span>
                </div>

                <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-sm rounded-btn transition-colors disabled:opacity-60" disabled={loading}>
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
