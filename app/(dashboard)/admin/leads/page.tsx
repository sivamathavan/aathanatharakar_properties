"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Mail, Calendar, User, Phone, CheckCircle, 
  ArrowRight, ArrowLeft, ClipboardList,
  Sparkles, Download, PlusCircle, ShieldCheck, X
} from "lucide-react";

const PIPELINE_STATUSES = [
  { value: "NEW", label: "New Leads", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { value: "SITE_VISIT", label: "Site Visit", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "CLOSED", label: "Closed / Won", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "LOST", label: "Lost Deal", color: "bg-red-100 text-red-800 border-red-200" },
];

const CHECKLIST_CATEGORIES = [
  { key: "INTERIOR_DESIGNER", label: "Interior Designer" },
  { key: "PAINTER", label: "Painter" },
  { key: "HOME_LOAN_ADVISOR", label: "Home Loan Advisor" },
  { key: "ELECTRICIAN", label: "Electrician" },
  { key: "MOVERS_PACKERS", label: "Movers & Packers" },
];

export default function AdminLeadsCRM() {
  const [leads, setLeads] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Lead Drawer State
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [updatingLead, setUpdatingLead] = useState(false);

  // Post-sale checklist selections
  const [selectedVendors, setSelectedVendors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (selectedLead) {
          const current = data.find((l: any) => l.id === selectedLead.id);
          if (current) setSelectedLead(current);
        }
      }
    } catch (error) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Failed to load platform users");
    }
  };

  const agents = users.filter(u => u.role === "AGENT" && u.agentProfile && u.accountStatus === "ACTIVE");
  const vendors = users.filter(u => u.role === "VENDOR" && u.vendorProfile && u.accountStatus === "ACTIVE");

  const handleUpdateLead = async (id: string, payload: { status?: string; assignedToId?: string | null; note?: string }) => {
    setUpdatingLead(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        toast.success("Lead updated successfully!");
        setNewNote("");
        fetchLeads();
        setSelectedLead(updated);
      } else {
        toast.error("Failed to update lead");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setUpdatingLead(false);
    }
  };

  const handleQuickMove = async (lead: any, direction: "left" | "right") => {
    const currentIndex = PIPELINE_STATUSES.findIndex(s => s.value === lead.status);
    let nextIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < PIPELINE_STATUSES.length) {
      const nextStatus = PIPELINE_STATUSES[nextIndex].value;
      await handleUpdateLead(lead.id, { status: nextStatus });
    }
  };

  const sendWhatsAppIntro = (categoryKey: string) => {
    const vendorId = selectedVendors[categoryKey];
    if (!vendorId) {
      return toast.error("Please select a vendor first!");
    }

    const selectedVendor = vendors.find(v => v.id === vendorId);
    if (!selectedVendor || !selectedVendor.vendorProfile) {
      return toast.error("Vendor details not found");
    }

    const leadName = selectedLead.name;
    const leadEmail = selectedLead.email;
    const locality = selectedLead.property?.locality || "Tamil Nadu";
    const vendorName = selectedVendor.vendorProfile.businessName;
    const vendorMobile = selectedVendor.vendorProfile.mobile.replace(/\D/g, "");
    const finalNumber = vendorMobile.startsWith("91") ? vendorMobile : `91${vendorMobile}`;

    const text = `Vanakkam ${selectedVendor.name},\n\nWe are pleased to introduce you to our premium client *${leadName}* (${leadEmail}) who is looking for *${categoryKey.replace(/_/g, " ")}* services for their property in *${locality}*. Please get in touch with them at your earliest convenience.\n\nBest regards,\nAdmin Team\nDK Promoters`;

    const whatsappUrl = `https://wa.me/${finalNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, "_blank");
    toast.success(`WhatsApp intro prepared for ${vendorName}!`);
  };

  const exportToCSV = () => {
    if (leads.length === 0) {
      return toast.error("No leads available to export");
    }

    const headers = ["Lead ID", "Inquirer Name", "Inquirer Email", "Message", "Property ID", "Property Title", "Status", "Assigned Agent", "Created At"];
    const rows = leads.map(l => [
      l.id,
      l.name,
      l.email,
      l.message,
      l.propertyId || "Direct",
      l.property?.title || "N/A",
      l.status,
      l.assignedTo?.name || "Unassigned",
      new Date(l.createdAt).toLocaleDateString(),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `property_leads_crm_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Leads report exported successfully!");
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E8E0D0] pb-4">
        <div>
          <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Active Deals</h1>
          <p className="text-xs text-navy-700 mt-0.5">Track all ongoing property deals through the pipeline. Drag left/right to update status.</p>
        </div>
        <Button onClick={exportToCSV} className="w-full sm:w-auto h-11 bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold rounded-btn transition-colors shadow-sm flex items-center justify-center gap-2">
          <Download className="w-4 h-4 text-gold-500" /> Export Leads to CSV
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-navy-700 font-medium">Loading CRM Pipeline...</div>
      ) : (
        /* Horizontal swipe & snap-scroll container on mobile, fits 6 cols grid on desktop */
        <div className="flex overflow-x-auto gap-4 snap-x snap-mandatory scroll-smooth pb-6 lg:grid lg:grid-cols-6 scrollbar-hide">
          {PIPELINE_STATUSES.map(col => {
            const colLeads = leads.filter(l => l.status === col.value);
            return (
              <div key={col.value} className="bg-white rounded-card p-3.5 border border-[#E8E0D0] snap-center shrink-0 w-[285px] lg:w-auto lg:shrink space-y-3.5 shadow-xs">
                
                {/* Column header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-[#E8E0D0]">
                  <h3 className="font-display font-bold text-navy-900 text-sm flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      col.value === 'CLOSED' ? 'bg-green-500' : col.value === 'LOST' ? 'bg-red-500' : 'bg-gold-500'
                    }`}></span>
                    {col.label}
                  </h3>
                  <span className="text-[10px] font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded-full border border-[#E8E0D0]/40">
                    {colLeads.length}
                  </span>
                </div>

                {/* Column body cards */}
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-0.5 scrollbar-hide">
                  {colLeads.map(lead => (
                    <Card 
                      key={lead.id} 
                      className="border-[#E8E0D0] shadow-2xs hover:shadow-sm hover:border-gold-500 bg-white cursor-pointer rounded-card group transition-all"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="p-3.5 space-y-3">
                        <div>
                          <h4 className="font-semibold text-navy-900 text-xs tracking-wide truncate group-hover:text-gold-600 transition-colors">{lead.name}</h4>
                          <span className="text-[10px] text-navy-700 truncate block mt-0.5">{lead.email}</span>
                        </div>

                        {lead.property && (
                          <div className="text-[10px] text-navy-800 bg-warm-cream/60 px-2 py-1 rounded border border-[#E8E0D0]/40 truncate">
                            Re: {lead.property.title}
                          </div>
                        )}

                        {lead.assignedTo && (
                          <div className="flex items-center text-[10px] text-navy-700 font-medium bg-navy-50/50 p-1.5 rounded border border-navy-100/50">
                            <User className="w-3.5 h-3.5 mr-1 text-gold-600 shrink-0" /> Agent: {lead.assignedTo.name}
                          </div>
                        )}

                        {/* Quick status navigation icons */}
                        <div className="flex justify-between items-center pt-2 border-t border-[#E8E0D0]/60 text-xs">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:bg-navy-50 text-navy-800" 
                            onClick={(e) => { e.stopPropagation(); handleQuickMove(lead, "left"); }}
                            disabled={col.value === PIPELINE_STATUSES[0].value}
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </Button>
                          <span className="text-[9px] text-navy-700 font-medium">{new Date(lead.createdAt).toLocaleDateString()}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full hover:bg-navy-50 text-navy-800" 
                            onClick={(e) => { e.stopPropagation(); handleQuickMove(lead, "right"); }}
                            disabled={col.value === PIPELINE_STATUSES[PIPELINE_STATUSES.length - 1].value}
                          >
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="text-center py-10 text-[11px] text-navy-700 italic bg-warm-cream/20 rounded-btn border border-[#E8E0D0]/20">
                      No leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Lead Drawer Overlay (fixed layout) */}
      {selectedLead && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-[#E8E0D0] pb-4">
                <div>
                  <span className="text-[10px] text-navy-700 uppercase font-bold tracking-wider">Lead Profile</span>
                  <h2 className="text-xl font-display font-bold text-navy-900 mt-1">{selectedLead.name}</h2>
                  <p className="text-xs text-navy-750 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2 text-gold-500" /> {selectedLead.email}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedLead(null)}
                  className="text-navy-700 hover:text-navy-950 rounded-full h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Status and Assignment Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawer-status" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Pipeline Status</Label>
                  <select
                    id="drawer-status"
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateLead(selectedLead.id, { status: e.target.value })}
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white text-xs font-medium text-navy-900 focus:outline-none"
                  >
                    {PIPELINE_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawer-assignee" className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Assign to Agent</Label>
                  <select
                    id="drawer-assignee"
                    value={selectedLead.assignedToId || ""}
                    onChange={(e) => handleUpdateLead(selectedLead.id, { assignedToId: e.target.value || null })}
                    className="w-full h-11 px-3 border border-[#E8E0D0] rounded-btn bg-white text-xs font-medium text-navy-900 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {agents.map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lead Enquired Property Details */}
              {selectedLead.property && (
                <div className="bg-navy-50/50 p-4 rounded-btn border border-navy-100/50 space-y-1">
                  <h4 className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">Target Property</h4>
                  <div className="font-semibold text-navy-900 text-sm">{selectedLead.property.title}</div>
                  <div className="text-xs text-navy-750 font-medium mt-0.5">{selectedLead.property.locality}, {selectedLead.property.city}</div>
                </div>
              )}

              {/* Lead Message */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-navy-800 uppercase tracking-wider">Original Inquirer Message</Label>
                <div className="bg-warm-cream/30 p-4 rounded-btn text-navy-900 text-xs italic border border-[#E8E0D0]/50 leading-relaxed font-sans">
                  "{selectedLead.message}"
                </div>
              </div>

              {/* Post-Sale Referral Checklist (Closed Deal only) */}
              {selectedLead.status === "CLOSED" && (
                <div className="bg-navy-50 p-5 rounded-btn border border-navy-100/80 space-y-4">
                  <div className="flex items-center gap-2 border-b border-navy-100 pb-2">
                    <ClipboardList className="w-4.5 h-4.5 text-gold-600" />
                    <h3 className="font-display font-semibold text-navy-950 text-sm flex items-center gap-1.5">
                      Post-Sale Referral Checklist
                      <Sparkles className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                    </h3>
                  </div>
                  <p className="text-[11px] text-navy-800 leading-normal font-medium">
                    Recommend this buyer client to professional vendors. Match them and click Intro to open pre-filled WhatsApp templates.
                  </p>

                  <div className="space-y-3">
                    {CHECKLIST_CATEGORIES.map(cat => {
                      const categoryVendors = vendors.filter(v => v.vendorProfile?.category === cat.key);
                      return (
                        <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-3 rounded-btn border border-navy-100 shadow-3xs font-sans">
                          <span className="text-xs font-semibold text-navy-900 w-full sm:w-1/3">{cat.label}</span>
                          <div className="flex gap-2 w-full sm:w-2/3">
                            <select
                              value={selectedVendors[cat.key] || ""}
                              onChange={(e) => setSelectedVendors({ ...selectedVendors, [cat.key]: e.target.value })}
                              className="flex-1 h-9 px-2 border border-[#E8E0D0] rounded-btn bg-white text-xs text-navy-900 focus:outline-none"
                            >
                              <option value="">Select Vendor</option>
                              {categoryVendors.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.vendorProfile?.businessName} ({v.vendorProfile?.serviceAreas?.[0] || "Coimbatore"})
                                </option>
                              ))}
                            </select>
                            <Button 
                              onClick={() => sendWhatsAppIntro(cat.key)}
                              className="bg-[#1D6A3A] hover:bg-[#15502c] text-white text-xs h-9 px-3 shrink-0 flex items-center gap-1 rounded-btn"
                              size="sm"
                            >
                              <Phone className="w-3 h-3" /> Intro
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lead Notes Section */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-navy-800 uppercase tracking-wider">CRM Timeline & Administrative Notes</Label>
                
                {/* Notes Input Form */}
                <div className="flex gap-2 font-sans">
                  <Textarea
                    placeholder="Type administrative action note here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={1}
                    className="flex-1 border-[#E8E0D0] rounded-btn text-xs text-navy-900 focus:ring-1 focus:ring-gold-500 focus:border-gold-500 h-11"
                  />
                  <Button 
                    onClick={() => handleUpdateLead(selectedLead.id, { note: newNote })}
                    disabled={updatingLead || !newNote.trim()}
                    className="bg-navy-900 text-gold-500 hover:bg-navy-950 hover:text-gold-400 font-bold shrink-0 h-11 px-4 rounded-btn flex items-center"
                  >
                    <PlusCircle className="w-4 h-4 mr-1 text-gold-500" /> Save
                  </Button>
                </div>

                {/* Notes Feed list */}
                <div className="space-y-2 max-h-[140px] overflow-y-auto border border-[#E8E0D0] rounded-btn p-3 bg-navy-50/20 scrollbar-hide">
                  {selectedLead.notes && selectedLead.notes.length > 0 ? (
                    selectedLead.notes.map((note: any) => (
                      <div key={note.id} className="text-xs bg-white p-2.5 rounded-btn border border-[#E8E0D0]/50 shadow-3xs space-y-1">
                        <div className="text-navy-900 leading-normal">{note.note}</div>
                        <div className="text-[9px] text-navy-700 font-medium text-right mt-1">
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-navy-700 py-4 italic">No timeline notes added yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer details */}
            <div className="border-t border-[#E8E0D0] pt-4 flex justify-between items-center text-[10px] text-navy-700 font-medium">
              <span>ID: {selectedLead.id}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)} className="text-gold-600 hover:text-gold-700 font-bold uppercase tracking-wider">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
