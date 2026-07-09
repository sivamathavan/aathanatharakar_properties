"use client";

import { useEffect, useState } from "react";
import { Search, Phone, MessageCircle, Handshake, MapPin, Briefcase, Star, Filter, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminCoBrokersPage() {
  const [brokers, setBrokers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCity, setFilterCity] = useState("ALL");

  // Modal forms
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBroker, setEditingBroker] = useState<any | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    email: "",
    reraNumber: "",
    officeAddress: "",
    operatingCities: "",
    experience: "1",
    bio: "",
  });

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      const res = await fetch("/api/admin/co-brokers");
      if (res.ok) {
        const data = await res.json();
        setBrokers(data);
      } else {
        toast.error("Failed to load co-brokers");
      }
    } catch {
      toast.error("Error loading co-brokers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete co-broker "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/co-brokers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Deleted co-broker ${name}`);
        fetchBrokers();
      } else {
        toast.error("Failed to delete co-broker");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleOpenAdd = () => {
    setEditingBroker(null);
    setForm({
      fullName: "",
      mobile: "",
      email: "",
      reraNumber: "",
      officeAddress: "",
      operatingCities: "",
      experience: "1",
      bio: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingBroker(b);
    setForm({
      fullName: b.fullName || "",
      mobile: b.mobile || "",
      email: b.email || b.user?.email || "",
      reraNumber: b.reraNumber || "",
      officeAddress: b.officeAddress || "",
      operatingCities: Array.isArray(b.operatingCities) ? b.operatingCities.join(", ") : "",
      experience: String(b.experience || "1"),
      bio: b.bio || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      operatingCities: form.operatingCities.split(",").map(c => c.trim()).filter(c => c),
      experience: parseInt(form.experience) || 1,
    };

    try {
      const url = editingBroker ? `/api/admin/co-brokers/${editingBroker.id}` : "/api/admin/co-brokers";
      const method = editingBroker ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingBroker ? "Co-Broker updated" : "Co-Broker added");
        setIsModalOpen(false);
        fetchBrokers();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save co-broker");
      }
    } catch {
      toast.error("Error saving co-broker");
    } finally {
      setSaving(false);
    }
  };

  const allCities = Array.from(
    new Set(brokers.flatMap((b) => b.operatingCities || []))
  ).sort();

  const filtered = brokers.filter((b) => {
    const matchSearch =
      !search ||
      b.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.mobile?.includes(search) ||
      b.operatingCities?.some((c: string) => c.toLowerCase().includes(search.toLowerCase()));
    const matchCity =
      filterCity === "ALL" || b.operatingCities?.includes(filterCity);
    return matchSearch && matchCity;
  });

  return (
    <div className="space-y-6 pb-12 font-sans relative">

      {/* Header */}
      <div className="border-b border-[#E8E0D0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Co-Brokers / Dealers</h1>
          <p className="text-xs text-navy-700 mt-0.5">Partner brokers and dealers you co-operate with for deals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleOpenAdd} className="bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold rounded-btn text-xs h-10 px-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Co-Broker
          </Button>
          <div className="text-xs font-bold text-navy-700 bg-navy-50 border border-[#E8E0D0] rounded-full px-3 py-1.5">
            {filtered.length} co-brokers
          </div>
        </div>
      </div>

      {/* Search + City Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <Input
            placeholder="Search by name, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-[#E8E0D0] rounded-btn text-xs"
          />
        </div>
        {allCities.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter className="w-4 h-4 text-navy-600 shrink-0" />
            {["ALL", ...allCities].map((city) => (
              <button
                key={city}
                onClick={() => setFilterCity(city)}
                className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                  filterCity === city
                    ? "bg-navy-900 text-gold-500 border-navy-900"
                    : "bg-white text-navy-700 border-[#E8E0D0] hover:border-navy-400"
                }`}
              >
                {city === "ALL" ? "All Cities" : city}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Broker Grid */}
      {loading ? (
        <div className="text-center py-20 text-xs text-navy-700">Loading co-brokers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E8E0D0] rounded-card">
          <Handshake className="w-10 h-10 text-navy-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-navy-700">No co-brokers found</p>
          <p className="text-xs text-navy-500 mt-1">
            Try adding a new broker or clearing filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((broker) => (
            <div
              key={broker.id}
              className="bg-white border border-[#E8E0D0] rounded-card p-5 hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-800 font-bold font-display text-base shrink-0">
                        {broker.fullName?.charAt(0) || "B"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display font-bold text-navy-900 text-sm truncate">{broker.fullName}</h3>
                        <p className="text-[10px] text-navy-600">{broker.mobile}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800">
                      Co-Broker
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleOpenEdit(broker)} className="p-1 hover:bg-navy-50 rounded text-navy-700" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(broker.id, broker.fullName)} className="p-1 hover:bg-red-50 rounded text-red-600" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-[11px] text-navy-700">
                  {broker.operatingCities?.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                      <span>{broker.operatingCities.join(", ")}</span>
                    </div>
                  )}
                  {broker.experience && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                      <span>{broker.experience} years experience</span>
                    </div>
                  )}
                  {broker.reraNumber && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-navy-400 shrink-0" />
                      <span className="font-mono text-[10px]">RERA: {broker.reraNumber}</span>
                    </div>
                  )}
                  {broker.officeAddress && (
                    <p className="text-[10px] text-navy-500 truncate">{broker.officeAddress}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[#E8E0D0] mt-auto">
                <a
                  href={`tel:+91${broker.mobile.replace(/\D/g, "")}`}
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
                  href={`https://wa.me/91${broker.mobile.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${broker.fullName}, This is DK Promoters. I have a co-brokerage opportunity to discuss with you.`)}`}
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
                {editingBroker ? "Edit Co-Broker Details" : "Add Partner Co-Broker"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-navy-50 rounded">
                <X className="w-5 h-5 text-navy-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-navy-800">Full Name</label>
                <Input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Swamy Nathan"
                  className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                />
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
                    placeholder="e.g. swamy@example.com"
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">RERA Number (Optional)</label>
                  <Input
                    value={form.reraNumber}
                    onChange={(e) => setForm({ ...form, reraNumber: e.target.value })}
                    placeholder="e.g. TN/11/Agent/001"
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-navy-800">Years Experience</label>
                  <Input
                    required
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={(e) => setForm({ ...form, experience: e.target.value })}
                    className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy-800">Office / Agency Address</label>
                <Input
                  required
                  value={form.officeAddress}
                  onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
                  placeholder="e.g. 45, Cross Cut Road, Gandhipuram, Coimbatore"
                  className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy-800">Operating Cities (Comma separated)</label>
                <Input
                  required
                  value={form.operatingCities}
                  onChange={(e) => setForm({ ...form, operatingCities: e.target.value })}
                  placeholder="e.g. Coimbatore, Tiruppur, Salem"
                  className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-navy-800">Short Bio / Notes (Optional)</label>
                <Input
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="e.g. Specializes in luxury villas and farm land sales."
                  className="border-[#E8E0D0] text-xs h-9 rounded-btn"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full h-10 bg-navy-900 text-gold-500 hover:bg-navy-950 font-bold rounded-btn text-xs mt-4"
              >
                {saving ? "Saving Changes..." : "Save Co-Broker Info"}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
