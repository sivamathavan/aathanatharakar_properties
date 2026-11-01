"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FirebaseUpload, type UploadedMedia } from "@/components/ui/FirebaseUpload";
import { LISTING_TYPES, PROPERTY_TYPES, TN_CITIES } from "@/lib/constants";
import { SpeakListingPanel, type DraftValues } from "@/components/voice/SpeakListingPanel";

export interface PropertyFormValues {
  title: string;
  description: string;
  type: string;
  listingType: string;
  price: string;
  priceUnit: string;
  area: string;
  areaUnit: string;
  bedrooms: string;
  bathrooms: string;
  city: string;
  locality: string;
  address: string;
  pincode: string;
  roadFacing: string;
  mapsLink: string;
  amenities: string;
  media: UploadedMedia[];
  ownerName: string;
  ownerPhone: string;
  surveyNumber: string;
  privateNotes: string;
}

export const EMPTY_PROPERTY: PropertyFormValues = {
  title: "",
  description: "",
  type: "",
  listingType: "BUY",
  price: "",
  priceUnit: "TOTAL",
  area: "",
  areaUnit: "SQFT",
  bedrooms: "",
  bathrooms: "",
  city: "",
  locality: "",
  address: "",
  pincode: "",
  roadFacing: "",
  mapsLink: "",
  amenities: "",
  media: [],
  ownerName: "",
  ownerPhone: "",
  surveyNumber: "",
  privateNotes: "",
};

const LISTING_LABEL: Record<string, string> = { BUY: "Sale", SELL: "Sale (owner)", RENT: "Rent", LEASE: "Lease" };
const selectCls = "w-full h-10 px-3 border border-input rounded-md bg-white text-sm";

export function PropertyForm({
  propertyId,
  initial = EMPTY_PROPERTY,
  storageFolder,
  photoLimit,
  allowVideo = false,
  doneHref,
}: {
  propertyId?: string;
  initial?: PropertyFormValues;
  storageFolder: string;
  photoLimit: number;
  allowVideo?: boolean;
  doneHref: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState<PropertyFormValues>(initial);
  const set = (patch: Partial<PropertyFormValues>) => setV((prev) => ({ ...prev, ...patch }));
  const isLand = v.type === "PLOT" || v.type === "FARM_LAND";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.media.length === 0) return void toast.error("Add at least one photo.");
    setSaving(true);
    const payload = {
      ...v,
      price: Number(v.price),
      area: Number(v.area),
      amenities: v.amenities.split(",").map((a) => a.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(propertyId ? `/api/properties/${propertyId}` : "/api/properties", {
        method: propertyId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error((await res.text()) || "Could not save. Please try again.");
        return;
      }
      toast.success(propertyId ? "Listing updated." : "Listing published.");
      router.push(doneHref);
      router.refresh();
    } catch {
      toast.error("No internet connection. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Only overwrite fields the draft actually filled; photos are kept.
  const applyDraft = (d: DraftValues) => {
    setV((prev) => {
      const next = { ...prev };
      for (const [k, val] of Object.entries(d)) {
        if (val && k in next && k !== "media") (next as any)[k] = val;
      }
      return next;
    });
  };

  return (
    <div className="space-y-5">
    {!propertyId && <SpeakListingPanel onFill={applyDraft} />}
    <Card>
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">Photos</h2>
            <FirebaseUpload storageFolder={storageFolder} maxFiles={photoLimit} existingMedia={v.media} allowVideo={allowVideo} onUpload={(media) => set({ media })} />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">Basic details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="pf-title">Title</Label>
                <Input id="pf-title" value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. 3BHK villa near RS Puram" required maxLength={160} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-type">Property type</Label>
                <select id="pf-type" className={selectCls} value={v.type} onChange={(e) => set({ type: e.target.value, areaUnit: e.target.value === "FARM_LAND" ? "ACRE" : e.target.value === "PLOT" ? "CENT" : v.areaUnit })} required>
                  <option value="">Choose type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-listing">For</Label>
                <select id="pf-listing" className={selectCls} value={v.listingType} onChange={(e) => set({ listingType: e.target.value, priceUnit: e.target.value === "RENT" ? "PER_MONTH" : e.target.value === "LEASE" ? "PER_YEAR" : "TOTAL" })} required>
                  {LISTING_TYPES.map((t) => (
                    <option key={t} value={t}>{LISTING_LABEL[t]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-price">Price (₹)</Label>
                <Input id="pf-price" type="number" min="0" inputMode="numeric" value={v.price} onChange={(e) => set({ price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-priceunit">Price is</Label>
                <select id="pf-priceunit" className={selectCls} value={v.priceUnit} onChange={(e) => set({ priceUnit: e.target.value })}>
                  <option value="TOTAL">Total price</option>
                  <option value="PER_SQFT">Per sq.ft</option>
                  <option value="PER_MONTH">Per month</option>
                  <option value="PER_YEAR">Per year</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">Size</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf-area">Area</Label>
                <Input id="pf-area" type="number" min="0" step="any" inputMode="decimal" value={v.area} onChange={(e) => set({ area: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-areaunit">Unit</Label>
                <select id="pf-areaunit" className={selectCls} value={v.areaUnit} onChange={(e) => set({ areaUnit: e.target.value })}>
                  <option value="SQFT">Sq.ft</option>
                  <option value="CENT">Cents</option>
                  <option value="ACRE">Acres</option>
                  <option value="GROUND">Grounds</option>
                </select>
              </div>
              {!isLand && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pf-bed">Bedrooms</Label>
                    <Input id="pf-bed" type="number" min="0" inputMode="numeric" value={v.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-bath">Bathrooms</Label>
                    <Input id="pf-bath" type="number" min="0" inputMode="numeric" value={v.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} />
                  </div>
                </>
              )}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="pf-road">Road facing (optional)</Label>
                <Input id="pf-road" value={v.roadFacing} onChange={(e) => set({ roadFacing: e.target.value })} placeholder="e.g. 30 ft road, east facing" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf-city">City</Label>
                <select id="pf-city" className={selectCls} value={v.city} onChange={(e) => set({ city: e.target.value })} required>
                  <option value="">Choose city</option>
                  {TN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-locality">Locality</Label>
                <Input id="pf-locality" value={v.locality} onChange={(e) => set({ locality: e.target.value })} placeholder="e.g. Vadavalli" required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="pf-address">Address shown to buyers</Label>
                <Textarea id="pf-address" rows={2} value={v.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street / landmark (no door number needed)" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-pin">Pincode (optional)</Label>
                <Input id="pf-pin" inputMode="numeric" maxLength={6} value={v.pincode} onChange={(e) => set({ pincode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-maps">Google Maps link (optional)</Label>
                <Input id="pf-maps" type="url" value={v.mapsLink} onChange={(e) => set({ mapsLink: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">Description</h2>
            <div className="space-y-2">
              <Label htmlFor="pf-desc">About this property</Label>
              <Textarea id="pf-desc" rows={5} value={v.description} onChange={(e) => set({ description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-amen">Amenities (comma separated)</Label>
              <Input id="pf-amen" value={v.amenities} onChange={(e) => set({ amenities: e.target.value })} placeholder="e.g. Car parking, Borewell, Compound wall" />
            </div>
          </section>

          <section className="space-y-4 rounded-lg border border-dashed border-navy-200 bg-navy-50/40 p-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold-600" /> Private notes
            </h2>
            <p className="text-xs text-navy-700">Only you can see these. They are never shown to buyers.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf-oname">Owner name</Label>
                <Input id="pf-oname" value={v.ownerName} onChange={(e) => set({ ownerName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-ophone">Owner phone</Label>
                <Input id="pf-ophone" type="tel" value={v.ownerPhone} onChange={(e) => set({ ownerPhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-survey">Survey number</Label>
                <Input id="pf-survey" value={v.surveyNumber} onChange={(e) => set({ surveyNumber: e.target.value })} />
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label htmlFor="pf-notes">Notes</Label>
                <Textarea id="pf-notes" rows={2} value={v.privateNotes} onChange={(e) => set({ privateNotes: e.target.value })} />
              </div>
            </div>
          </section>

          <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn disabled:opacity-60" disabled={saving}>
            {saving ? "Saving…" : propertyId ? "Save changes" : "Publish listing"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}

/** Shape a stored property (+ private details) into form values. */
export function toFormValues(p: any, priv: any = {}): PropertyFormValues {
  const s = (x: unknown) => (x === null || x === undefined ? "" : String(x));
  return {
    title: s(p.title),
    description: s(p.description),
    type: s(p.type),
    listingType: s(p.listingType) || "BUY",
    price: s(p.price),
    priceUnit: s(p.priceUnit) || "TOTAL",
    area: s(p.area),
    areaUnit: s(p.areaUnit) || "SQFT",
    bedrooms: s(p.bedrooms),
    bathrooms: s(p.bathrooms),
    city: s(p.city),
    locality: s(p.locality),
    address: s(p.address),
    pincode: s(p.pincode),
    roadFacing: s(p.roadFacing),
    mapsLink: s(p.mapsLink),
    amenities: (p.amenities || []).join(", "),
    media: (p.media || []).map((m: any) => ({ url: m.url, type: m.type, path: m.path || null })),
    ownerName: s(priv.ownerName),
    ownerPhone: s(priv.ownerPhone),
    surveyNumber: s(priv.surveyNumber),
    privateNotes: s(priv.notes),
  };
}
