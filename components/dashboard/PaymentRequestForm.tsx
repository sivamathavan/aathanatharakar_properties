"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { formatINR } from "@/lib/plans";
import type { PlanDef } from "@/types";

export interface UpiInfo {
  id: string;
  name: string;
}

// Pay by UPI, then send the UTR (12-digit reference from the UPI app).
// The admin checks it against the bank statement and switches the plan on.
export function PaymentRequestForm({
  kind,
  upi,
  plans = [],
  propertyId,
  boostPricePerWeek = 0,
  initialPlanId,
  onDone,
}: {
  kind: "PLAN" | "BOOST";
  upi: UpiInfo;
  plans?: PlanDef[];
  propertyId?: string;
  boostPricePerWeek?: number;
  initialPlanId?: string;
  onDone?: () => void;
}) {
  const [planId, setPlanId] = useState(initialPlanId || plans[0]?.id || "");
  const [period, setPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [weeks, setWeeks] = useState(1);
  const [utr, setUtr] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const plan = plans.find((p) => p.id === planId);
  const amount = kind === "BOOST" ? boostPricePerWeek * weeks : plan ? (period === "YEARLY" ? plan.priceYearly : plan.priceMonthly) : 0;
  const note = kind === "BOOST" ? `Boost ${weeks}w` : `${plan?.name || ""} ${period === "YEARLY" ? "1 year" : "1 month"}`;
  const upiLink = useMemo(
    () => (upi.id ? `upi://pay?pa=${encodeURIComponent(upi.id)}&pn=${encodeURIComponent(upi.name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}` : ""),
    [upi.id, upi.name, amount, note]
  );

  useEffect(() => {
    if (!upiLink) return setQr(null);
    QRCode.toDataURL(upiLink, { margin: 1, width: 220 }).then(setQr).catch(() => setQr(null));
  }, [upiLink]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[A-Za-z0-9]{6,30}$/.test(utr.trim())) return void toast.error("Enter the UTR / reference number from your UPI app.");
    setSaving(true);
    try {
      const res = await fetch("/api/agent/payment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, planId, period, propertyId, weeks, utr: utr.trim() }),
      });
      if (!res.ok) return void toast.error((await res.text()) || "Could not send. Please try again.");
      toast.success("Payment sent for checking. We'll switch it on within a few hours.");
      setUtr("");
      onDone?.();
    } finally {
      setSaving(false);
    }
  };

  if (!upi.id) {
    return <p className="text-sm text-navy-700">Online payment details are being set up. Please call DK Promoters to pay.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {kind === "PLAN" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pay-plan">Plan</Label>
            <select id="pay-plan" className="w-full h-10 px-3 border rounded-md bg-white text-sm" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-period">Pay for</Label>
            <select id="pay-period" className="w-full h-10 px-3 border rounded-md bg-white text-sm" value={period} onChange={(e) => setPeriod(e.target.value as "MONTHLY" | "YEARLY")}>
              <option value="MONTHLY">1 month</option>
              <option value="YEARLY">1 year (save more)</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="pay-weeks">How long</Label>
          <select id="pay-weeks" className="w-full h-10 px-3 border rounded-md bg-white text-sm" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
            {[1, 2, 4].map((w) => (
              <option key={w} value={w}>{w} week{w === 1 ? "" : "s"} · {formatINR(boostPricePerWeek * w)}</option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-lg border border-[#E8E0D0] bg-cream-50 p-4 space-y-3">
        <p className="text-sm text-navy-900">
          <span className="font-bold">Step 1.</span> Pay <span className="font-bold">{formatINR(amount)}</span> by UPI to <span className="font-mono">{upi.id}</span> ({upi.name}).
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {qr && <img src={qr} alt="UPI payment QR code" width={150} height={150} className="rounded border bg-white" />}
          <div className="flex flex-col gap-2">
            <a href={upiLink} className="inline-flex h-10 px-4 items-center justify-center rounded-btn bg-navy-900 text-gold-500 font-bold text-sm sm:hidden">Open UPI app</a>
            <CopyButton text={upi.id} label="Copy UPI ID" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pay-utr"><span className="font-bold">Step 2.</span> Enter the UTR / reference number</Label>
        <Input id="pay-utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="12-digit number from your UPI app" inputMode="numeric" maxLength={30} required />
      </div>
      <Button type="submit" disabled={saving || amount <= 0} className="w-full h-11 bg-gold-500 text-navy-900 font-bold hover:bg-gold-400">
        {saving ? "Sending…" : "I have paid"}
      </Button>
    </form>
  );
}
