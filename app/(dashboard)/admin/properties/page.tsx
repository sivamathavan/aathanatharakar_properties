"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Eye, Building2, MapPin } from "lucide-react";
import Link from "next/link";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/admin/properties");
      const data = await res.json();
      setProperties(data);
    } catch (error) {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Property marked as ${status}`);
        fetchProperties();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch(`/api/admin/properties/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyIds: selectedIds, status }),
      });
      if (res.ok) {
        toast.success(`${selectedIds.length} properties marked as ${status}`);
        setSelectedIds([]);
        fetchProperties();
      } else {
        toast.error("Failed to update status in bulk");
      }
    } catch (error) {
      toast.error("An error occurred during bulk update");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map(p => p.id));
    }
  };

  const getListingBadgeClass = (type: string) => {
    switch(type) {
      case 'BUY': return 'bg-gold-500 text-navy-900 border-gold-600';
      case 'RENT': return 'bg-[#1D6A3A]/15 text-[#1D6A3A] border-[#1D6A3A]/20';
      case 'LEASE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SELL': return 'bg-navy-50 text-navy-900 border-navy-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Page Title */}
      {/* Page Title & Bulk Actions */}
      <div className="border-b border-[#E8E0D0] pb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Properties Management</h1>
          <p className="text-xs text-navy-700 mt-0.5">Approve property listings, review agent draft posts, and moderate active inventory.</p>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2 bg-navy-50 p-2 rounded-btn border border-navy-100">
            <span className="text-xs text-navy-800 font-bold self-center px-2">{selectedIds.length} selected</span>
            <Button size="sm" onClick={() => handleBulkStatusChange("ACTIVE")} disabled={bulkLoading} className="bg-[#1D6A3A] hover:bg-[#15502c] text-white text-[10px] h-8 px-2.5 font-bold rounded-btn">
              Approve All
            </Button>
            <Button size="sm" onClick={() => handleBulkStatusChange("REJECTED")} disabled={bulkLoading} variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 text-[10px] h-8 px-2.5 font-semibold rounded-btn">
              Reject All
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-navy-750 font-medium">Loading properties list...</div>
      ) : (
        <>
          {/* Mobile Card List (Visible on <768px, Hidden on Desktop) */}
          <div className="md:hidden space-y-4">
            {properties.map(property => (
              <Card key={property.id} className="border-[#E8E0D0] bg-white rounded-card shadow-2xs p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-navy-900 truncate" title={property.title}>{property.title}</h3>
                    <p className="text-[11px] text-navy-700 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gold-500 shrink-0" /> {property.locality}, {property.city}
                    </p>
                    <p className="text-xs font-bold text-navy-900 mt-1.5">₹{Number(property.price).toLocaleString('en-IN')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    property.status === 'ACTIVE' ? 'bg-[#1D6A3A]/10 text-[#1D6A3A] border border-[#1D6A3A]/20' : 
                    property.status === 'PENDING' ? 'bg-gold-500/10 text-navy-950 border border-gold-500/30' : 'bg-gray-150 text-gray-800'
                  }`}>
                    {property.status}
                  </span>
                </div>

                <div className="bg-navy-50/50 p-2.5 rounded-btn border border-navy-100/50 text-xs space-y-1">
                  <p className="font-bold text-gold-600 text-[10px] uppercase tracking-wider">Posted By</p>
                  <p className="text-[11px] text-navy-800 leading-normal font-semibold mt-1">{property.postedBy?.name}</p>
                  <p className="text-[10px] text-navy-700 leading-normal truncate">{property.postedBy?.email}</p>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-[#E8E0D0] text-xs">
                  <span className="text-[10px] text-navy-700">Created: {new Date(property.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-1.5">
                    <Link href={`/properties/${property.id}`} target="_blank">
                      <Button variant="outline" size="sm" className="h-8 px-2.5 text-navy-800 border-[#E8E0D0] hover:bg-navy-50 font-sans text-[10px] font-bold rounded-btn flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </Link>
                    {property.status !== "ACTIVE" && (
                      <Button size="sm" className="bg-[#1D6A3A] hover:bg-[#15502c] text-white text-[10px] h-8 px-2.5 font-bold rounded-btn" onClick={() => handleStatusChange(property.id, "ACTIVE")}>
                        Approve
                      </Button>
                    )}
                    {property.status !== "REJECTED" && (
                      <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 text-[10px] h-8 px-2.5 font-semibold rounded-btn" onClick={() => handleStatusChange(property.id, "REJECTED")}>
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {properties.length === 0 && (
              <div className="text-center py-10 bg-white border border-[#E8E0D0] rounded-card text-xs text-navy-700 italic">
                No properties found.
              </div>
            )}
          </div>

          {/* Desktop Table View (Visible on md+, Hidden on Mobile) */}
          <Card className="hidden md:block border-[#E8E0D0] bg-white rounded-card shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-navy-50/60 border-b border-[#E8E0D0]/80">
                    <tr>
                      <th className="px-6 py-4 w-12">
                        <input type="checkbox" className="rounded border-gray-300" checked={properties.length > 0 && selectedIds.length === properties.length} onChange={toggleAll} />
                      </th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Property Details</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Posted By</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D0]/50">
                    {properties.map(property => (
                      <tr key={property.id} className="hover:bg-navy-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <input type="checkbox" className="rounded border-gray-300" checked={selectedIds.includes(property.id)} onChange={() => toggleSelection(property.id)} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-navy-900 text-sm">{property.title}</div>
                          <div className="text-xs text-navy-700 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getListingBadgeClass(property.listingType)}`}>
                              For {property.listingType}
                            </span>
                            <span className="text-navy-700">{property.type} • {property.locality}, {property.city}</span>
                          </div>
                          <div className="text-xs font-bold text-navy-900 mt-2">₹{Number(property.price).toLocaleString('en-IN')}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-navy-900">{property.postedBy?.name}</div>
                          <div className="text-xs text-navy-700 mt-0.5">{property.postedBy?.email}</div>
                          <div className="text-[10px] text-navy-750 mt-0.5">{property.postedBy?.phone}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-navy-800 font-medium">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            property.status === 'ACTIVE' ? 'bg-[#1D6A3A]/10 text-[#1D6A3A] border border-[#1D6A3A]/20' : 
                            property.status === 'PENDING' ? 'bg-gold-500/10 text-navy-950 border border-gold-500/30' : 'bg-gray-150 text-gray-800'
                          }`}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/properties/${property.id}`} target="_blank">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-navy-50 text-navy-800" 
                                title="View Property"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {property.status !== "ACTIVE" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-navy-50 text-[#1D6A3A]" 
                                onClick={() => handleStatusChange(property.id, "ACTIVE")} 
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {property.status !== "REJECTED" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-navy-50 text-red-650" 
                                onClick={() => handleStatusChange(property.id, "REJECTED")} 
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {properties.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-xs text-navy-700 italic">No properties found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
