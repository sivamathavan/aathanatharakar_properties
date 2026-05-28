"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";

const DEFAULT_MESSAGE = "I'd like to enquire about your services. Please get in touch.";

const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const isValidPhone = (s: string) => /^[0-9+\-\s()]{7,20}$/.test(s);

export function VendorEnquiryForm({ vendorId }: { vendorId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: DEFAULT_MESSAGE,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Please enter your name");
    if (!isValidEmail(formData.email))
      return toast.error("Please enter a valid email");
    if (formData.phone && !isValidPhone(formData.phone))
      return toast.error("Please enter a valid phone number");

    setLoading(true);
    try {
      const res = await fetch(`/api/vendors/${vendorId}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(
          "Enquiry sent. Our broker team will coordinate with the vendor and get back to you."
        );
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: DEFAULT_MESSAGE,
        });
      } else {
        const txt = await res.text();
        toast.error(txt || "Failed to send. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Your Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Full Name"
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) =>
            setFormData({ ...formData, phone: e.target.value })
          }
          placeholder="+91 98765 43210"
          autoComplete="tel"
          inputMode="tel"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          required
          rows={4}
          maxLength={2000}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn shadow-sm disabled:opacity-60"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...
          </>
        ) : (
          "Send Enquiry"
        )}
      </Button>

      <p className="text-[11px] text-navy-700 flex items-start gap-1.5 leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
        Enquiries are coordinated through Aadana Tharakar. Vendor contact details are kept private.
      </p>
    </form>
  );
}
