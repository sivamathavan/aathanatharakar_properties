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
import { FirebaseUpload } from "@/components/ui/FirebaseUpload";
import { Loader2 } from "lucide-react";

export default function EditPropertyPage({ params }: { params: { id: string } }) {
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
          router.push("/dashboard/properties");
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
        router.push("/dashboard/properties");
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Edit Property</h1>
        <p className="text-gray-500">Update your listing details below.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Details */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b">Basic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full space-y-2">
                  <Label htmlFor="title">Property Title</Label>
                  <Input 
                    id="title" value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Property Type</Label>
                  <select 
                    id="type" className="w-full p-2 border rounded"
                    value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required
                  >
                    <option value="">Select Type</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listingType">Listing Type</Label>
                  <select 
                    id="listingType" className="w-full p-2 border rounded"
                    value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value})} required
                  >
                    <option value="">Select Listing</option>
                    {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input 
                    id="price" type="number" min="0" value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceUnit">Price Unit</Label>
                  <select 
                    id="priceUnit" className="w-full p-2 border rounded"
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
              <h2 className="text-lg font-bold mb-4 pb-2 border-b">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="area">Area (Sq.Ft)</Label>
                  <Input 
                    id="area" type="number" min="0" value={formData.area} 
                    onChange={e => setFormData({...formData, area: e.target.value})} required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input 
                    id="bedrooms" type="number" min="0" value={formData.bedrooms} 
                    onChange={e => setFormData({...formData, bedrooms: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input 
                    id="bathrooms" type="number" min="0" value={formData.bathrooms} 
                    onChange={e => setFormData({...formData, bathrooms: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b">Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <select 
                    id="city" className="w-full p-2 border rounded"
                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required
                  >
                    <option value="">Select City</option>
                    {TN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locality">Locality</Label>
                  <Input 
                    id="locality" value={formData.locality} 
                    onChange={e => setFormData({...formData, locality: e.target.value})} required 
                  />
                </div>
                <div className="col-span-full space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea 
                    id="address" value={formData.address} rows={2}
                    onChange={e => setFormData({...formData, address: e.target.value})} required 
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b">Additional Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Property Description</Label>
                  <Textarea 
                    id="description" value={formData.description} rows={5}
                    onChange={e => setFormData({...formData, description: e.target.value})} required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities (Comma separated)</Label>
                  <Input 
                    id="amenities" value={formData.amenities} 
                    onChange={e => setFormData({...formData, amenities: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b">Photos & Videos</h2>
              <div className="space-y-2">
                <Label>Update Property Images</Label>
                <FirebaseUpload 
                  onUpload={(media) => setFormData({...formData, media})} 
                  existingMedia={formData.media}
                  maxFiles={15} 
                  storageFolder="properties"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#1D6A3A] hover:bg-[#15502c]" disabled={loading}>
               {loading ? "Updating..." : "Update Property"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
