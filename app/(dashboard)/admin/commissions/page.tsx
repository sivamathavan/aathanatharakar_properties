"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DollarSign, Download, Plus, Filter, FileSpreadsheet, Sparkles } from "lucide-react";

const COMMISSION_TYPES = [
  { value: "PROPERTY_SALE", label: "Property Sale" },
  { value: "PROPERTY_RENTAL", label: "Property Rental" },
  { value: "PROPERTY_LEASE", label: "Property Lease" },
  { value: "BUILDER_REFERRAL", label: "Builder Referral" },
  { value: "INTERIOR_REFERRAL", label: "Interior Referral" },
  { value: "PAINTER_REFERRAL", label: "Painter Referral" },
  { value: "ELECTRICIAN_REFERRAL", label: "Electrician Referral" },
  { value: "HOME_LOAN_REFERRAL", label: "Home Loan Referral" },
  { value: "OTHER_SERVICE", label: "Other Service" },
  { value: "PLATFORM_FEE", label: "Platform Fee" },
];

const COMMISSION_STATUSES = [
  { value: "EXPECTED", label: "Expected" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Form State
  const [formData, setFormData] = useState({
    type: "PROPERTY_SALE",
    amount: "",
    status: "EXPECTED",
    notes: "",
    propertyId: "",
  });

  useEffect(() => {
    fetchCommissions();
    fetchProperties();
  }, []);

  const fetchCommissions = async () => {
    try {
      const res = await fetch("/api/admin/commissions");
      if (res.ok) {
        const data = await res.json();
        setCommissions(data);
      }
    } catch (error) {
      toast.error("Failed to load commissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/admin/properties");
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (error) {
      console.error("Failed to load properties for dropdown", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(formData.amount);
    if (isNaN(amt) || amt <= 0) {
      return toast.error("Commission amount must be greater than 0");
    }

    try {
      const res = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Commission record added successfully!");
        setFormData({
          type: "PROPERTY_SALE",
          amount: "",
          status: "EXPECTED",
          notes: "",
          propertyId: "",
        });
        setShowAddForm(false);
        fetchCommissions();
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Failed to add commission");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // Indian Currency Formatting
  const formatIndianCurrency = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filter calculations
  const filteredCommissions = commissions.filter((c) => {
    const typeMatch = typeFilter === "ALL" || c.type === typeFilter;
    const statusMatch = statusFilter === "ALL" || c.status === statusFilter;
    return typeMatch && statusMatch;
  });

  // Calculate totals
  const totalReceived = commissions
    .filter((c) => c.status === "RECEIVED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalExpected = commissions
    .filter((c) => c.status === "EXPECTED")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalDeals = commissions.length;

  // CSV Exporter
  const exportToCSV = () => {
    if (filteredCommissions.length === 0) {
      return toast.error("No records found to export");
    }

    const headers = ["ID", "Type", "Amount", "Status", "Notes", "Property Title", "Created At"];
    const rows = filteredCommissions.map((c) => [
      c.id,
      c.type,
      c.amount,
      c.status,
      c.notes || "",
      c.property?.title || "N/A",
      new Date(c.createdAt).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `commissions_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report exported successfully!");
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Commissions & Revenue</h1>
          <p className="text-gray-500">Track and manage broker platform commissions and allied service referral fees</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => exportToCSV()}
            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 md:flex-none bg-[#E85D24] hover:bg-[#d6521e] text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Record
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-[#E5DDD0] shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue Received</p>
              <h3 className="text-3xl font-bold text-[#1D6A3A]">{formatIndianCurrency(totalReceived)}</h3>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-[#1D6A3A] border border-green-100">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5DDD0] shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Expected Pipeline</p>
              <h3 className="text-3xl font-bold text-[#E85D24]">{formatIndianCurrency(totalExpected)}</h3>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[#E85D24] border border-orange-100">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5DDD0] shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Tracked Deals</p>
              <h3 className="text-3xl font-bold text-gray-800">{totalDeals}</h3>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 border border-gray-100">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Record Form */}
      {showAddForm && (
        <Card className="border-[#E5DDD0] shadow-md animate-in slide-in-from-top duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800">Add New Commission / Referral Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Commission Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full p-2 border rounded bg-white text-sm"
                    required
                  >
                    {COMMISSION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="e.g. 75000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border rounded bg-white text-sm"
                    required
                  >
                    {COMMISSION_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-full md:col-span-1 space-y-2">
                  <Label htmlFor="propertyId">Associated Property (Optional)</Label>
                  <select
                    id="propertyId"
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full p-2 border rounded bg-white text-sm"
                  >
                    <option value="">None</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-full md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Notes / Details</Label>
                  <Textarea
                    id="notes"
                    rows={1}
                    placeholder="e.g. 2% commission from Kannan Builders for Interior referral"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#1D6A3A] hover:bg-[#15502c] text-white">
                  Save Deal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Table & Filters */}
      <Card className="border-[#E5DDD0] shadow-sm">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
          <CardTitle className="text-lg font-bold text-gray-800">Tracked Transactions</CardTitle>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Type Filter */}
            <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg px-3 py-1.5 text-sm">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {COMMISSION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg px-3 py-1.5 text-sm">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                {COMMISSION_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading commission data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Deal Type</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Property</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Amount</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Date</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCommissions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 text-sm">
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {c.type.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.property?.title || <span className="italic text-gray-400">Direct referral</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#E85D24]">
                        {formatIndianCurrency(Number(c.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            c.status === "RECEIVED"
                              ? "bg-green-100 text-green-800"
                              : c.status === "EXPECTED"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={c.notes}>
                        {c.notes || "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredCommissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
