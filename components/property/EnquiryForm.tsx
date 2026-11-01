"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";

// Ends with a space so anything the visitor adds starts as a new sentence (the server trims it).
const DEFAULT_MESSAGE = "I am interested in this property. Please share more details. ";

export function EnquiryForm({
  propertyId,
  source = "WEB",
  privacyNote = "Owner contact details are never shared publicly.",
  idPrefix = "enq",
}: {
  propertyId: string;
  source?: "WEB" | "AGENT_PAGE";
  privacyNote?: string;
  idPrefix?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: DEFAULT_MESSAGE, website: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Please enter your name");
    if (formData.phone.replace(/[^0-9]/g, "").length < 10) return toast.error("Please enter a valid phone number");

    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/enquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, source }),
      });
      if (res.ok) {
        setSent(true);
        toast.success("Enquiry sent. You'll get a call back shortly.");
        setFormData({ name: "", email: "", phone: "", message: DEFAULT_MESSAGE, website: "" });
      } else {
        toast.error((await res.text()) || "Could not send your enquiry. Please try again.");
      }
    } catch {
      toast.error("No internet connection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-btn border border-green-200 bg-green-50 p-4 text-sm text-green-900 space-y-2">
        <p className="font-semibold">Enquiry sent.</p>
        <p>You&apos;ll get a call back shortly.</p>
        <button type="button" className="text-xs underline" onClick={() => setSent(false)}>
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Your name</Label>
        <Input id={`${idPrefix}-name`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Full name" autoComplete="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-phone`}>Phone number</Label>
        <Input id={`${idPrefix}-phone`} type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="98765 43210" autoComplete="tel" inputMode="tel" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-email`}>Email (optional)</Label>
        <Input id={`${idPrefix}-email`} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@example.com" autoComplete="email" inputMode="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-message`}>Message</Label>
        <Textarea id={`${idPrefix}-message`} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={3} maxLength={2000} />
      </div>
      {/* Hidden from people; bots fill it in and get silently dropped. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
      <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn shadow-sm disabled:opacity-60" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending…
          </>
        ) : (
          "Send enquiry"
        )}
      </Button>
      <p className="text-[11px] text-navy-700 flex items-start gap-1.5 leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
        {privacyNote}
      </p>
    </form>
  );
}
