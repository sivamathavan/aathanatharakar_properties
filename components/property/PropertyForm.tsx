"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast, errorText } from "@/lib/notify";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FirebaseUpload, type UploadedMedia } from "@/components/ui/FirebaseUpload";
import { LISTING_TYPES, PROPERTY_TYPES, TN_CITIES } from "@/lib/constants";
import { SpeakListingPanel, type DraftValues } from "@/components/voice/SpeakListingPanel";
import { EMPTY_PROPERTY, type PropertyFormValues } from "@/lib/property-form-values";

export type { PropertyFormValues };
import { useT } from "@/components/i18n/I18nProvider";

const LISTING_LABEL: Record<string, string> = { BUY: "Sale", RENT: "Rent", LEASE: "Lease" };
const TYPE_NAME: Record<string, string> = { APARTMENT: "Apartment", VILLA: "Villa", HOUSE: "House", PLOT: "Plot", COMMERCIAL: "Commercial", WAREHOUSE: "Warehouse", FARM_LAND: "Farm land", PG_HOSTEL: "PG / hostel" };
const selectCls = "w-full h-10 px-3 border border-input rounded-md bg-white text-sm";

export function PropertyForm({
  propertyId,
  initial = EMPTY_PROPERTY,
  storageFolder,
  photoLimit,
  allowVideo = false,
  showPrivate = true,
  doneHref,
}: {
  propertyId?: string;
  initial?: PropertyFormValues;
  storageFolder: string;
  photoLimit: number;
  allowVideo?: boolean;
  /** False when an admin edits an agent's listing: its private notes stay with the agent. */
  showPrivate?: boolean;
  doneHref: string;
}) {
  const t = useT();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [v, setV] = useState<PropertyFormValues>(initial);
  const set = (patch: Partial<PropertyFormValues>) => setV((prev) => ({ ...prev, ...patch }));
  const isLand = v.type === "PLOT" || v.type === "FARM_LAND";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.media.length === 0) return void toast.error(t("Add at least one photo."));
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
        toast.error(await errorText(res, t("Could not save. Please try again.")));
        return;
      }
      toast.success(propertyId ? t("Listing updated.") : t("Listing published."));
      router.push(doneHref);
      router.refresh();
    } catch {
      toast.error(t("No internet connection. Please try again."));
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
            <h2 className="text-lg font-bold pb-2 border-b">{t("Photos")}</h2>
            <FirebaseUpload storageFolder={storageFolder} maxFiles={photoLimit} existingMedia={v.media} allowVideo={allowVideo} onUpload={(media) => set({ media })} />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">{t("Basic details")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="pf-title">{t("Title")}</Label>
                <Input id="pf-title" value={v.title} onChange={(e) => set({ title: e.target.value })} placeholder={t("e.g. 3BHK villa near RS Puram")} required maxLength={160} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-type">{t("Property type")}</Label>
                <select id="pf-type" className={selectCls} value={v.type} onChange={(e) => set({ type: e.target.value, areaUnit: e.target.value === "FARM_LAND" ? "ACRE" : e.target.value === "PLOT" ? "CENT" : v.areaUnit })} required>
                  <option value="">{t("Choose type")}</option>
                  {PROPERTY_TYPES.map((x) => (
                    <option key={x} value={x}>{t(TYPE_NAME[x] || x)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-listing">{t("For")}</Label>
                <select id="pf-listing" className={selectCls} value={v.listingType} onChange={(e) => set({ listingType: e.target.value, priceUnit: e.target.value === "RENT" ? "PER_MONTH" : e.target.value === "LEASE" ? "PER_YEAR" : "TOTAL" })} required>
                  {LISTING_TYPES.map((x) => (
                    <option key={x} value={x}>{t(LISTING_LABEL[x])}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-price">{t("Price (₹)")}</Label>
                <Input id="pf-price" type="number" min="0" inputMode="numeric" value={v.price} onChange={(e) => set({ price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-priceunit">{t("Price is")}</Label>
                <select id="pf-priceunit" className={selectCls} value={v.priceUnit} onChange={(e) => set({ priceUnit: e.target.value })}>
                  <option value="TOTAL">{t("Total price")}</option>
                  <option value="PER_SQFT">{t("Per sq.ft")}</option>
                  <option value="PER_MONTH">{t("Per month")}</option>
                  <option value="PER_YEAR">{t("Per year")}</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">{t("Size")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf-area">{t("Area")}</Label>
                <Input id="pf-area" type="number" min="0" step="any" inputMode="decimal" value={v.area} onChange={(e) => set({ area: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-areaunit">{t("Unit")}</Label>
                <select id="pf-areaunit" className={selectCls} value={v.areaUnit} onChange={(e) => set({ areaUnit: e.target.value })}>
                  <option value="SQFT">{t("Sq.ft")}</option>
                  <option value="CENT">{t("Cents")}</option>
                  <option value="ACRE">{t("Acres")}</option>
                  <option value="GROUND">{t("Grounds")}</option>
                </select>
              </div>
              {!isLand && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pf-bed">{t("Bedrooms")}</Label>
                    <Input id="pf-bed" type="number" min="0" inputMode="numeric" value={v.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-bath">{t("Bathrooms")}</Label>
                    <Input id="pf-bath" type="number" min="0" inputMode="numeric" value={v.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} />
                  </div>
                </>
              )}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="pf-road">{t("Road facing (optional)")}</Label>
                <Input id="pf-road" value={v.roadFacing} onChange={(e) => set({ roadFacing: e.target.value })} placeholder={t("e.g. 30 ft road, east facing")} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">{t("Location")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pf-city">{t("City")}</Label>
                <select id="pf-city" className={selectCls} value={v.city} onChange={(e) => set({ city: e.target.value })} required>
                  <option value="">{t("Choose city")}</option>
                  {TN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-locality">{t("Locality")}</Label>
                <Input id="pf-locality" value={v.locality} onChange={(e) => set({ locality: e.target.value })} placeholder={t("e.g. Vadavalli")} required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="pf-address">{t("Address shown to buyers")}</Label>
                <Textarea id="pf-address" rows={2} value={v.address} onChange={(e) => set({ address: e.target.value })} placeholder={t("Street / landmark (no door number needed)")} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-pin">{t("Pincode (optional)")}</Label>
                <Input id="pf-pin" inputMode="numeric" maxLength={6} value={v.pincode} onChange={(e) => set({ pincode: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf-maps">{t("Google Maps link (optional)")}</Label>
                <Input id="pf-maps" type="url" value={v.mapsLink} onChange={(e) => set({ mapsLink: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold pb-2 border-b">{t("Description")}</h2>
            <div className="space-y-2">
              <Label htmlFor="pf-desc">{t("About this property")}</Label>
              <Textarea id="pf-desc" rows={5} value={v.description} onChange={(e) => set({ description: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pf-amen">{t("Amenities (comma separated)")}</Label>
              <Input id="pf-amen" value={v.amenities} onChange={(e) => set({ amenities: e.target.value })} placeholder={t("e.g. Car parking, Borewell, Compound wall")} />
            </div>
          </section>

          {showPrivate && (
            <section className="space-y-4 rounded-lg border border-dashed border-navy-200 bg-navy-50/40 p-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-gold-600" /> {t("Private notes")}
              </h2>
              <p className="text-xs text-navy-700">{t("Only you can see these. They are never shown to buyers.")}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pf-oname">{t("Owner name")}</Label>
                  <Input id="pf-oname" value={v.ownerName} onChange={(e) => set({ ownerName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-ophone">{t("Owner phone")}</Label>
                  <Input id="pf-ophone" type="tel" value={v.ownerPhone} onChange={(e) => set({ ownerPhone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pf-survey">{t("Survey number")}</Label>
                  <Input id="pf-survey" value={v.surveyNumber} onChange={(e) => set({ surveyNumber: e.target.value })} />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="pf-notes">{t("Notes")}</Label>
                  <Textarea id="pf-notes" rows={2} value={v.privateNotes} onChange={(e) => set({ privateNotes: e.target.value })} />
                </div>
              </div>
            </section>
          )}

          <Button type="submit" className="w-full h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn disabled:opacity-60" disabled={saving}>
            {saving ? t("Saving…") : propertyId ? t("Save changes") : t("Publish listing")}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  );
}
