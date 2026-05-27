"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export function PropertyEnquiryForm({ propertyId, propertyTitle }: { propertyId: string, propertyTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: `Hi, I am interested in "${propertyTitle}". Please contact me with more details.`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Enquiry sent successfully! The property owner will contact you soon.");
        setFormData({ ...formData, message: "" });
      } else {
        toast.error("Failed to send enquiry. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-semibold text-navy-800">Your Name</Label>
        <Input 
          id="name"
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
          placeholder="John Doe"
          className="h-10 text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold text-navy-800">Email Address</Label>
        <Input 
          id="email"
          type="email" 
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required 
          placeholder="john@example.com"
          className="h-10 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-xs font-semibold text-navy-800">Phone Number</Label>
        <Input 
          id="phone"
          type="tel" 
          value={formData.phone} 
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          required 
          placeholder="+91 98765 43210"
          className="h-10 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-xs font-semibold text-navy-800">Message</Label>
        <Textarea 
          id="message"
          value={formData.message} 
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required 
          rows={3}
          className="text-sm resize-none"
        />
      </div>

      <Button type="submit" className="w-full h-11 bg-gold-500 text-navy-900 hover:bg-gold-400 font-bold shadow-sm transition-colors" disabled={loading}>
        {loading ? "Sending Enquiry..." : "Send Enquiry"}
      </Button>
    </form>
  );
}
