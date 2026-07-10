import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, Home, Store, Users2, Zap, CheckCircle2, Receipt, Handshake } from "lucide-react";
import { UserRole } from "@prisma/client";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.ADMIN) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-[#FDF8E8]">
      {/* Mobile Admin Header */}
      <AdminHeader />

      {/* Desktop Sidebar (lg+ visible) */}
      <aside className="w-64 bg-[#0D1B2A] text-white hidden lg:flex flex-col shrink-0 border-r border-[#1E3278]">
        <div className="p-6 border-b border-[#1E3278]">
          <h2 className="text-xl font-display font-bold text-gold-500">டிகே புரமோட்டர்ஸ்</h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-sans">Admin Control Panel</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/admin" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <LayoutDashboard className="w-5 h-5 text-gold-500" />
            <span>Overview</span>
          </Link>
          
          <Link href="/admin/properties" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <Home className="w-5 h-5 text-gold-500" />
            <span>Properties</span>
          </Link>

          <Link href="/admin/vendors" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <Store className="w-5 h-5 text-gold-500" />
            <span>Vendors &amp; Services</span>
          </Link>

          <Link href="/admin/co-brokers" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <Handshake className="w-5 h-5 text-gold-500" />
            <span>Co-Brokers / Dealers</span>
          </Link>

          <Link href="/admin/leads" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <Zap className="w-5 h-5 text-gold-500" />
            <span>Active Deals</span>
          </Link>

          <Link href="/admin/completed-deals" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-gold-500" />
            <span>Completed Deals</span>
          </Link>

          <Link href="/admin/commissions" className="flex items-center space-x-3 px-4 py-3 text-gray-300 rounded-lg hover:bg-navy-800 hover:text-white transition-all text-sm font-medium">
            <Receipt className="w-5 h-5 text-gold-500" />
            <span>Revenue Tracker</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden pb-safe">
        {children}
      </main>
    </div>
  );
}
