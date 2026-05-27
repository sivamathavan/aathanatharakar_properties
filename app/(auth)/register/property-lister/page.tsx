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

export default function PropertyListerRegistration() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, role: UserRole.PROPERTY_LISTER }),
      });

      if (res.ok) {
        toast.success("Registration successful! Check your email to login.");
        signIn("email", { email: formData.email, callbackUrl: "/dashboard" });
      } else {
        const error = await res.text();
        toast.error(error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-cream p-4 py-12">
      <Card className="w-full max-w-md border-[#E8E0D0] bg-white rounded-card shadow-sm font-sans">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-display font-bold text-navy-900">Property Owner Registration</CardTitle>
          <CardDescription className="text-xs text-navy-750 font-sans mt-1">Create your account to start listing properties for free</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
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
              <p className="text-[10px] text-navy-700 leading-normal">We will email you a secure magic passwordless login link.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required 
                className="h-11 border-[#E8E0D0] focus:ring-1 focus:ring-gold-500 focus:border-gold-500 rounded-btn text-navy-900"
              />
              <p className="text-[10px] text-navy-700 leading-normal">Your phone number is kept confidential and is never displayed publicly.</p>
            </div>

            <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-sans font-bold shadow-sm rounded-btn transition-colors mt-2" disabled={loading}>
              {loading ? "Registering..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-navy-700 leading-relaxed border-t border-[#E8E0D0]/50 pt-5">
            By registering, you agree to our Terms of Service & Privacy Policy.
            <div className="mt-3">
              <Link href="/register" className="text-gold-600 font-bold hover:underline">Change account type</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
