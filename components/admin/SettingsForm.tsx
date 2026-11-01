"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PlansConfig, SiteConfig } from "@/types";

function Field({ id, label, value, onChange, type = "number", hint }: { id: string; label: string; value: string | number; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <label htmlFor={id} className="block space-y-1 text-sm">
      <span className="font-medium text-navy-900">{label}</span>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 border rounded-md bg-white" />
      {hint && <span className="block text-xs text-navy-600">{hint}</span>}
    </label>
  );
}

export function SettingsForm({ plans, site }: { plans: PlansConfig; site: SiteConfig }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [p, setP] = useState({
    trialDays: plans.trialDays,
    boostPricePerWeek: plans.boostPricePerWeek,
    trial: { listingLimit: plans.plans.TRIAL.listingLimit, photoLimit: plans.plans.TRIAL.photoLimit, aiDraftsPerMonth: plans.plans.TRIAL.aiDraftsPerMonth },
    starter: { priceMonthly: plans.plans.STARTER.priceMonthly, priceYearly: plans.plans.STARTER.priceYearly, listingLimit: plans.plans.STARTER.listingLimit, photoLimit: plans.plans.STARTER.photoLimit, aiDraftsPerMonth: plans.plans.STARTER.aiDraftsPerMonth },
    pro: { priceMonthly: plans.plans.PRO.priceMonthly, priceYearly: plans.plans.PRO.priceYearly, listingLimit: plans.plans.PRO.listingLimit, photoLimit: plans.plans.PRO.photoLimit, aiDraftsPerMonth: plans.plans.PRO.aiDraftsPerMonth },
  });
  const [s, setS] = useState(site);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plans: p, site: s }) });
    setSaving(false);
    if (!res.ok) return void toast.error((await res.text()) || "Could not save.");
    toast.success("Settings saved.");
    router.refresh();
  };

  const tier = (key: "starter" | "pro", name: string) => (
    <fieldset className="bg-white rounded-card border border-[#E4DED2] p-4 grid grid-cols-2 gap-3">
      <legend className="px-1 font-bold text-navy-900">{name}</legend>
      <Field id={`${key}-m`} label="₹ per month" value={p[key].priceMonthly} onChange={(v) => setP({ ...p, [key]: { ...p[key], priceMonthly: v } })} />
      <Field id={`${key}-y`} label="₹ per year" value={p[key].priceYearly} onChange={(v) => setP({ ...p, [key]: { ...p[key], priceYearly: v } })} />
      <Field id={`${key}-l`} label="Listings" value={p[key].listingLimit} onChange={(v) => setP({ ...p, [key]: { ...p[key], listingLimit: v } })} hint="Up to 100" />
      <Field id={`${key}-ph`} label="Photos per listing" value={p[key].photoLimit} onChange={(v) => setP({ ...p, [key]: { ...p[key], photoLimit: v } })} hint="Up to 20" />
      <Field id={`${key}-ai`} label="Voice listings / month" value={p[key].aiDraftsPerMonth} onChange={(v) => setP({ ...p, [key]: { ...p[key], aiDraftsPerMonth: v } })} hint="Each one is an AI call" />
    </fieldset>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="space-y-3">
        <h2 className="font-bold text-navy-900">Where agents pay you</h2>
        <div className="bg-white rounded-card border border-[#E4DED2] p-4 grid sm:grid-cols-2 gap-3">
          <Field id="upi-id" type="text" label="UPI ID" value={s.upiId} onChange={(v) => setS({ ...s, upiId: v })} hint="Agents see this with a QR code" />
          <Field id="upi-name" type="text" label="Name on UPI" value={s.upiName} onChange={(v) => setS({ ...s, upiName: v })} />
          <Field id="wa" type="text" label="Your WhatsApp for buyers" value={s.brokerWhatsapp} onChange={(v) => setS({ ...s, brokerWhatsapp: v })} hint="Shown on your own listings on the main site" />
          <Field id="gstin" type="text" label="GSTIN (optional)" value={s.gstin} onChange={(v) => setS({ ...s, gstin: v })} hint="When set, the tracker adds 18% GST to commission invoices" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-navy-900">Plans</h2>
        <fieldset className="bg-white rounded-card border border-[#E4DED2] p-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <legend className="px-1 font-bold text-navy-900">Free trial</legend>
          <Field id="trial-days" label="Days" value={p.trialDays} onChange={(v) => setP({ ...p, trialDays: Number(v) })} />
          <Field id="trial-l" label="Listings" value={p.trial.listingLimit} onChange={(v) => setP({ ...p, trial: { ...p.trial, listingLimit: Number(v) } })} />
          <Field id="trial-ph" label="Photos each" value={p.trial.photoLimit} onChange={(v) => setP({ ...p, trial: { ...p.trial, photoLimit: Number(v) } })} />
          <Field id="trial-ai" label="Voice listings" value={p.trial.aiDraftsPerMonth} onChange={(v) => setP({ ...p, trial: { ...p.trial, aiDraftsPerMonth: Number(v) } })} />
          <Field id="boost" label="Boost ₹ / week" value={p.boostPricePerWeek} onChange={(v) => setP({ ...p, boostPricePerWeek: Number(v) })} />
        </fieldset>
        {tier("starter", "Starter")}
        {tier("pro", "Pro")}
      </section>

      <button type="submit" disabled={saving} className="h-11 px-6 rounded-btn bg-navy-900 text-gold-500 font-bold">{saving ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
