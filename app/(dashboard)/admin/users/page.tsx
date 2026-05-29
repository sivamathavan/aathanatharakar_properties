"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Ban, ShieldCheck, UserCheck, Trash2 } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, accountStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus }),
      });
      if (res.ok) {
        toast.success(`User marked as ${accountStatus}`);
        fetchUsers();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the user "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`User "${name}" deleted permanently`);
        fetchUsers();
      } else {
        const errText = await res.text();
        toast.error(errText || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Page Title */}
      <div className="border-b border-[#E8E0D0] pb-4">
        <h1 className="font-display font-bold text-xl md:text-2xl text-navy-900 leading-snug">Users Management</h1>
        <p className="text-xs text-navy-700 mt-0.5">Review credentials, moderate roles, and manage verification approvals for agents and vendors.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs text-navy-750 font-medium">Loading platform members...</div>
      ) : (
        <>
          {/* Mobile Card List (Visible on <768px, Hidden on Desktop) */}
          <div className="md:hidden space-y-4">
            {users.filter(u => u.role !== "ADMIN").map(user => (
              <Card key={user.id} className="border-[#E8E0D0] bg-white rounded-card shadow-2xs p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-sm text-navy-900">{user.name}</h3>
                    <p className="text-[11px] text-navy-700 mt-0.5">{user.email}</p>
                    <p className="text-[10px] text-navy-700 mt-0.5">{user.phone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    user.accountStatus === 'ACTIVE' ? 'bg-[#1D6A3A]/10 text-[#1D6A3A] border border-[#1D6A3A]/20' : 
                    user.accountStatus === 'PENDING' ? 'bg-gold-500/10 text-navy-950 border border-gold-500/30' : 
                    user.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.accountStatus}
                  </span>
                </div>

                <div className="bg-navy-50/50 p-2.5 rounded-btn border border-navy-100/50 text-xs">
                  <p className="font-bold text-gold-600 text-[10px] uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
                  {user.agentProfile && <p className="text-[11px] text-navy-800 mt-1 leading-normal font-sans">Office: {user.agentProfile.officeAddress}</p>}
                  {user.vendorProfile && <p className="text-[11px] text-navy-800 mt-1 leading-normal font-sans">Business: {user.vendorProfile.businessName}</p>}
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-[#E8E0D0] text-xs">
                  <span className="text-[10px] text-navy-700">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {user.accountStatus !== "ACTIVE" && (
                      <Button size="sm" className="bg-[#1D6A3A] hover:bg-[#15502c] text-white text-[10px] h-8 px-2.5 font-bold rounded-btn" onClick={() => handleStatusChange(user.id, "ACTIVE")}>
                        Approve
                      </Button>
                    )}
                    {user.accountStatus !== "REJECTED" && user.accountStatus === "PENDING" && (
                      <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 text-[10px] h-8 px-2.5 font-semibold rounded-btn" onClick={() => handleStatusChange(user.id, "REJECTED")}>
                        Reject
                      </Button>
                    )}
                    {user.accountStatus === "ACTIVE" && (
                      <Button size="sm" variant="outline" className="border-red-250 text-red-700 hover:bg-red-50 text-[10px] h-8 px-2.5 font-semibold rounded-btn" onClick={() => handleStatusChange(user.id, "SUSPENDED")}>
                        Suspend
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 text-[10px] h-8 px-2.5 font-semibold rounded-btn flex items-center gap-1" onClick={() => handleDeleteUser(user.id, user.name)}>
                      <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            
            {users.filter(u => u.role !== "ADMIN").length === 0 && (
              <div className="text-center py-10 bg-white border border-[#E8E0D0] rounded-card text-xs text-navy-700 italic">
                No users found.
              </div>
            )}
          </div>

          {/* Desktop Table view (Visible on md+, Hidden on Mobile) */}
          <Card className="hidden md:block border-[#E8E0D0] bg-white rounded-card shadow-xs overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-navy-50/60 border-b border-[#E8E0D0]/80">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">User Details</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Role & Business</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-semibold text-navy-900 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D0]/50">
                    {users.filter(u => u.role !== "ADMIN").map(user => (
                      <tr key={user.id} className="hover:bg-navy-50/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-navy-900 text-sm">{user.name}</div>
                          <div className="text-xs text-navy-700 mt-0.5">{user.email}</div>
                          <div className="text-[11px] text-navy-700 mt-0.5">{user.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gold-600 uppercase tracking-wide mb-1">{user.role.replace('_', ' ')}</div>
                          {user.agentProfile && <div className="text-xs text-navy-800 leading-normal font-sans">Office: {user.agentProfile.officeAddress}</div>}
                          {user.vendorProfile && <div className="text-xs text-navy-800 leading-normal font-sans">{user.vendorProfile.businessName}</div>}
                        </td>
                        <td className="px-6 py-4 text-xs text-navy-800 font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.accountStatus === 'ACTIVE' ? 'bg-[#1D6A3A]/10 text-[#1D6A3A] border border-[#1D6A3A]/20' : 
                            user.accountStatus === 'PENDING' ? 'bg-gold-500/10 text-navy-955 border border-gold-500/30' : 
                            user.accountStatus === 'SUSPENDED' ? 'bg-red-100 text-red-900 border border-red-200' : 'bg-gray-150 text-gray-800'
                          }`}>
                            {user.accountStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            {user.accountStatus !== "ACTIVE" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-navy-50 text-[#1D6A3A]" 
                                onClick={() => handleStatusChange(user.id, "ACTIVE")} 
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            {user.accountStatus !== "REJECTED" && user.accountStatus === "PENDING" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-navy-50 text-red-650" 
                                onClick={() => handleStatusChange(user.id, "REJECTED")} 
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            {user.accountStatus === "ACTIVE" && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full hover:bg-navy-50 text-red-600" 
                                onClick={() => handleStatusChange(user.id, "SUSPENDED")} 
                                title="Suspend"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-navy-50 text-red-600 hover:text-red-800" 
                              onClick={() => handleDeleteUser(user.id, user.name)} 
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.filter(u => u.role !== "ADMIN").length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-xs text-navy-700 italic">No users found</td>
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
