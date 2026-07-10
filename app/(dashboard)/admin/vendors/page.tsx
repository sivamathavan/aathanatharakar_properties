"use client";

import { useEffect, useState } from "react";
import { Search, Phone, MessageCircle, Store, MapPin, Star, Shield, BadgeCheck, Filter, Pencil, Trash2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CATEGORY_LABELS: Record<string, string> = {
  BUILDER: "Builder",
  INTERIOR_DESIGNER: "Interior Designer",
  PAINTER: "Painter",
  ELECTRICIAN: "Electrician",
  PLUMBER: "Plumber",
  CARPENTER: "Carpenter",
  ARCHITECT: "Architect",
  VASTU_CONSULTANT: "Vastu Consultant",
  HOME_LOAN_ADVISOR: "Home Loan Advisor",
  MOVERS_PACKERS: "Movers & Packers",
  TILES_FLOORING: "Tiles & Flooring",
  CIVIL_CONTRACTOR: "Civil Contractor",
};

const CATEGORY_COLORS: Record<string, string> = {
  BUILDER: "bg-blue-100 text-blue-800",
  INTERIOR_DESIGNER: "bg-pink-100 text-pink-800",
  PAINTER: "bg-orange-100 text-orange-800",
  ELECTRICIAN: "bg-yellow-100 text-yellow-800",
  PLUMBER: "bg-cyan-100 text-cyan-800",
  CARPENTER: "bg-amber-100 text-amber-800",
  ARCHITECT: "bg-purple-100 text-purple-800",
  VASTU_CONSULTANT: "bg-emerald-100 text-emerald-800",
  HOME_LOAN_ADVISOR: "bg-indigo-100 text-indigo-800",
  MOVERS_PACKERS: "bg-red-100 text-red-800",
  TILES_FLOORING: "bg-teal-100 text-teal-800",
  CIVIL_CONTRACTOR: "bg-gray-100 text-gray-800",
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    mobile: "",
    email: "",
    category: "CIVIL_CONTRACTOR",
    serviceAreas: "",
    yearsInBusiness: "1",
    priceRangeMin: "",
    priceRangeMax: "",
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      } else {
        toast.error("Failed to load vendors");
      }
    } catch {
      toast.error("Error loading vendors");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Deleted vendor ${name}`);
        fetchVendors();
      } else {
        toast.error("Failed to delete vendor");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setForm({
      businessName: "",
      ownerName: "",
      mobile: "",
      email: "",
      category: "CIVIL_CONTRACTOR",
      serviceAreas: "",
      yearsInBusiness: "1",
      priceRangeMin: "",
      priceRangeMax: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingVendor(v);
    setForm({
      businessName: v.businessName || "",
      ownerName: v.ownerName || "",
      mobile: v.mobile || "",
      email: v.email || "",
      category: v.category || "CIVIL_CONTRACTOR",
      serviceAreas: Array.isArray(v.serviceAreas) ? v.serviceAreas.join(", ") : "",
      yearsInBusiness: String(v.yearsInBusiness || "1"),
      priceRangeMin: String(v.priceRangeMin || ""),
      priceRangeMax: String(v.priceRangeMax || ""),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      serviceAreas: form.serviceAreas.split(",").map(a => a.trim()).filter(a => a),
      yearsInBusiness: parseInt(form.yearsInBusiness) || 1,
      priceRangeMin: form.priceRangeMin ? parseInt(form.priceRangeMin) : null,
      priceRangeMax: form.priceRangeMax ? parseInt(form.priceRangeMax) : null,
    };

    try {
      const url = editingVendor ? `/api/admin/vendors/${editingVendor.id}` : "/api/admin/vendors";
      const method = editingVendor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingVendor ? "Vendor updated" : "Vendor added");
        setIsModalOpen(false);
        fetchVendors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save vendor");
      }
    } catch {
      toast.error("Error saving vendor");
    } finally {
      setSaving(false);
    }
  };

  const filtered = vendors.filter((v) => {
    const matchSearch =
      !search ||
      v.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      v.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      v.serviceAreas?.some((a: string) => a.toLowerCase().includes(search.toLowerCase()));
    const matchCategory = filterCategory === "ALL" || v.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const categories = ["ALL", ...Array.from(new Set(vendors.map((v) => v.category)))];

  return (
    <div className="space-y-6 pb-12 font-sans relative">

      {/* Header */}
      <div className="border-b border-[#E8E0D0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Vendors & Services</h1>
          <p className="text-xs text-navy-700 mt-0.5">All allied service providers you work with as a broker.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAdd} className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold rounded-btn text-xs h-10 px-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
          <div className="text-xs font-bold text-navy-700 bg-navy-50 border border-[#E8E0D0] rounded-full px-3 py-1.5">
            {filtered.length} vendors
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <Input
            placeholder="Search by name, owner, or area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-[#E8E0D0] rounded-btn text-xs"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter className="w-4 h-4 text-navy-600 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                filterCategory === cat
                  ? "bg-navy-900 text-gold-500 border-navy-900"
                  : "bg-white text-navy-700 border-[#E8E0D0] hover:border-navy-400"
              }`}
            >
              {cat === "ALL" ? "All Types" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-navy-700">Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E8E0D0] rounded-card">
          <Store className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-navy-700">No vendors found</p>
          <p className="text-xs text-navy-500 mt-1">Try adding a new vendor or clearing filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white border border-[#E8E0D0] rounded-card p-5 hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-navy-900 text-sm truncate">{vendor.businessName}</h3>
                      {vendor.isVerified && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      {vendor.isFeatured && (
                        <Star className="w-4 h-4 text-gold-500 fill-gold-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-navy-600 mt-0.5">Owner: {vendor.ownerName}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[vendor.category] || "bg-gray-100 text-gray-700"}`}>
                      {CATEGORY_LABELS[vendor.category] || vendor.category}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenEdit(vendor)} className="p-1 hover:bg-navy-50 rounded text-navy-700" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(vendor.id, vendor.businessName)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-[11px] text-navy-700">
                  {vendor.serviceAreas?.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                      <span>{vendor.serviceAreas.join(", ")}</span>
                    </div>
                  )}
                  {vendor.yearsInBusiness && (
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                      <span>{vendor.yearsInBusiness} years in business</span>
                    </div>
                  )}
                  {vendor.priceRangeMin && vendor.priceRangeMax && (
                    <div className="text-[10px] text-navy-500">
                      Budget: ₹{vendor.priceRangeMin.toLocaleString("en-IN")} – ₹{vendor.priceRangeMax.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#E8E0D0] mt-auto">
                <a
                  href={`tel:+91${vendor.mobile.replace(/\D/g, "")}`}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs font-bold border-[#E8E0D0] text-navy-800 hover:bg-navy-50 flex items-center justify-center gap-1.5 rounded-btn"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </Button>
                </a>
                <a
                  href={`https://wa.me/91${vendor.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${vendor.businessName}, I'm DK Promoters broker. I have a client interested in your ${CATEGORY_LABELS[vendor.category]} services.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    className="w-full h-9 text-xs font-bold bg-[#25D366] hover:bg-[#1DA851] text-white flex items-center justify-center gap-1.5 rounded-btn"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-out Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E0D0] rounded-card shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#E8E0D0] pb-3">
              <h2 className="font-display font-bold text-lg text-navy-900">
                {editingVendor ? "Edit Vendor Details" : "Add Allied Vendor"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-navy-50 rounded">
                <X className="w-5 h-5 text-navy-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-navy-800">Business / Company Name</label>
                <Input
                  required
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  placeholder="e.g. DK Painters & Decors"
                  className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Owner Name</label>
                  <Input
                    required
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    placeholder="e.g. Kumar Swamy"
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Category / Profession</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full h-9 border border-[#E8E0D0] rounded-btn px-2 text-xs bg-white text-navy-900"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Mobile Number</label>
                  <Input
                    required
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Email Address</label>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. Swamy@example.com"
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy-800">Service Areas (Comma separated)</label>
                <Input
                  required
                  value={form.serviceAreas}
                  onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })}
                  placeholder="e.g. RS Puram, Gandhipuram, Saibaba Colony"
                  className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Years Active</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={form.yearsInBusiness}
                    onChange={(e) => setForm({ ...form, yearsInBusiness: e.target.value })}
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Min Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={form.priceRangeMin}
                    onChange={(e) => setForm({ ...form, priceRangeMin: e.target.value })}
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Max Price (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={form.priceRangeMax}
                    onChange={(e) => setForm({ ...form, priceRangeMax: e.target.value })}
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-10 bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold rounded-btn text-xs mt-4"
              >
                {saving ? "Saving Changes..." : "Save Vendor Info"}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
