"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { friendlyAuthError, signUpAgent } from "@/lib/auth-client";
import { TN_CITIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm({ trialDays, trialListings }: { trialDays: number; trialListings: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [v, setV] = useState({ name: "", agencyName: "", phone: "", city: "", email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.password.length < 8) return void toast.error("Use a password of at least 8 characters.");
    setLoading(true);
    try {
      await signUpAgent(v);
      toast.success("Your trial has started. Check your email to confirm your address.");
      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-warm-cream p-4 py-10">
      <div className="w-full max-w-lg bg-white border border-[#E4DED2] rounded-card shadow-sm p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-display font-bold text-navy-900">Get your own property page</h1>
          <p className="text-sm text-navy-700">
            Free for {trialDays} days, up to {trialListings} listings. No card needed.
          </p>
        </div>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rg-name">Your name</Label>
            <Input id="rg-name" autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg-agency">Agency name (optional)</Label>
            <Input id="rg-agency" autoComplete="organization" value={v.agencyName} onChange={(e) => setV({ ...v, agencyName: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg-phone">Mobile number</Label>
            <Input id="rg-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} required className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rg-city">City</Label>
            <select id="rg-city" className="w-full h-11 px-3 border border-input rounded-md bg-white text-sm" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} required>
              <option value="">Choose city</option>
              {TN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="rg-email">Email</Label>
            <Input id="rg-email" type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required className="h-11" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="rg-password">Password</Label>
            <Input id="rg-password" type="password" autoComplete="new-password" minLength={8} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} required className="h-11" />
            <p className="text-xs text-navy-600">At least 8 characters.</p>
          </div>
          <Button type="submit" disabled={loading} className="sm:col-span-2 h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating your page…</> : "Start free trial"}
          </Button>
        </form>
        <p className="text-xs text-navy-600">
          By signing up you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
        <p className="text-center text-sm text-navy-700">
          Already have an account? <Link href="/login" className="underline font-semibold text-navy-900">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
