"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TN_CITIES, PROPERTY_TYPES, LISTING_TYPES } from "@/lib/constants";
import { CloudinaryUpload } from "@/components/ui/CloudinaryUpload";
import { Loader2 } from "lucide-react";

export default function AdminEditPropertyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    listingType: "",
    price: "",
    priceUnit: "TOTAL",
    area: "",
    bedrooms: "",
    bathrooms: "",
    address: "",
    city: "",
    locality: "",
    amenities: "", 
    media: [] as { url: string; type: "IMAGE" | "VIDEO" }[],
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            title: data.title || "",
            description: data.description || "",
            type: data.type || "",
            listingType: data.listingType || "",
            price: data.price || "",
            priceUnit: data.priceUnit || "TOTAL",
            area: data.area || "",
            bedrooms: data.bedrooms || "",
            bathrooms: data.bathrooms || "",
            address: data.address || "",
            city: data.city || "",
            locality: data.locality || "",
            amenities: Array.isArray(data.amenities) ? data.amenities.join(", ") : "",
            media: data.media || [],
          });
        } else {
          toast.error("Failed to load property");
          router.push("/admin/properties");
        }
      } catch (error) {
        toast.error("Error loading property");
      } finally {
        setInitialLoad(false);
      }
    };
    fetchProperty();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const amenitiesArray = formData.amenities.split(',').map(a => a.trim()).filter(a => a);
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      area: parseFloat(formData.area),
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      amenities: amenitiesArray,
      media: formData.media,
    };

    try {
      const res = await fetch(`/api/properties/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Property updated successfully!");
        router.push("/admin/properties");
        router.refresh();
      } else {
        const error = await res.text();
        toast.error(error || "Update failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Edit Property</h1>
        <p className="text-xs text-navy-700 mt-0.5">Modify property details for DK Promoters.</p>
      </div>

      <Card className="border-[#E8E0D0] bg-white rounded-card shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Details */}
            <div>
              <h2 className="text-sm font-bold text-navy-900 mb-4 pb-2 border-b border-[#E8E0D0]">Basic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full space-y-2">
                  <Label htmlFor="title" className="text-xs text-navy-800 font-semibold">Property Title</Label>
                  <Input 
                    id="title" value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-xs text-navy-800 font-semibold">Property Type</Label>
                  <select 
                    id="type" className="w-full p-2 border border-[#E8E0D0] rounded-btn text-xs h-10 bg-white"
                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required
                  >
                    <option value="">Select Type</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listingType" className="text-xs text-navy-800 font-semibold">Listing Type</Label>
                  <select 
                    id="listingType" className="w-full p-2 border border-[#E8E0D0] rounded-btn text-xs h-10 bg-white"
                    value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value})} required
                  >
                    <option value="">Select Listing</option>
                    {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-xs text-navy-800 font-semibold">Price (₹)</Label>
                  <Input 
                    id="price" type="number" min="0" value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} required 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceUnit" className="text-xs text-navy-800 font-semibold">Price Unit</Label>
                  <select 
                    id="priceUnit" className="w-full p-2 border border-[#E8E0D0] rounded-btn text-xs h-10 bg-white"
                    value={formData.priceUnit} onChange={e => setFormData({...formData, priceUnit: e.target.value})} required
                  >
                    <option value="TOTAL">Total Price</option>
                    <option value="PER_SQFT">Per Sq.Ft</option>
                    <option value="PER_MONTH">Per Month</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Property Specs */}
            <div>
              <h2 className="text-sm font-bold text-navy-900 mb-4 pb-2 border-b border-[#E8E0D0]">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-xs text-navy-800 font-semibold">Area (Sq.Ft)</Label>
                  <Input 
                    id="area" type="number" min="0" value={formData.area} 
                    onChange={e => setFormData({...formData, area: e.target.value})} required 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms" className="text-xs text-navy-800 font-semibold">Bedrooms</Label>
                  <Input 
                    id="bedrooms" type="number" min="0" value={formData.bedrooms} 
                    onChange={e => setFormData({...formData, bedrooms: e.target.value})} 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms" className="text-xs text-navy-800 font-semibold">Bathrooms</Label>
                  <Input 
                    id="bathrooms" type="number" min="0" value={formData.bathrooms} 
                    onChange={e => setFormData({...formData, bathrooms: e.target.value})} 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h2 className="text-sm font-bold text-navy-900 mb-4 pb-2 border-b border-[#E8E0D0]">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs text-navy-800 font-semibold">City</Label>
                  <select 
                    id="city" className="w-full p-2 border border-[#E8E0D0] rounded-btn text-xs h-10 bg-white"
                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required
                  >
                    <option value="">Select City</option>
                    {TN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locality" className="text-xs text-navy-800 font-semibold">Locality</Label>
                  <Input 
                    id="locality" value={formData.locality} 
                    onChange={e => setFormData({...formData, locality: e.target.value})} required 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label htmlFor="address" className="text-xs text-navy-800 font-semibold">Full Address</Label>
                  <Textarea 
                    id="address" value={formData.address} rows={2}
                    onChange={e => setFormData({...formData, address: e.target.value})} required 
                    className="border-[#E8E0D0] rounded-btn text-xs p-2.5"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h2 className="text-sm font-bold text-navy-900 mb-4 pb-2 border-b border-[#E8E0D0]">Additional Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs text-navy-800 font-semibold">Property Description</Label>
                  <Textarea 
                    id="description" value={formData.description} rows={5}
                    onChange={e => setFormData({...formData, description: e.target.value})} required 
                    className="border-[#E8E0D0] rounded-btn text-xs p-2.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amenities" className="text-xs text-navy-800 font-semibold">Amenities (Comma separated)</Label>
                  <Input 
                    id="amenities" value={formData.amenities} 
                    onChange={e => setFormData({...formData, amenities: e.target.value})} 
                    className="border-[#E8E0D0] rounded-btn text-xs h-10"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <h2 className="text-sm font-bold text-navy-900 mb-4 pb-2 border-b border-[#E8E0D0]">Photos & Videos</h2>
              <div className="space-y-2">
                <CloudinaryUpload 
                  onUpload={(media) => setFormData({...formData, media})} 
                  existingMedia={formData.media}
                  maxFiles={15} 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 bg-[#1D6A3A] hover:bg-[#15502c] text-white font-bold rounded-btn shadow-sm disabled:opacity-60 text-xs" 
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Property"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
