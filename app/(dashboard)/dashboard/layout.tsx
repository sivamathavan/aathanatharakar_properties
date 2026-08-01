import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import Link from "next/link";
import { Home, List, MessageSquare, UserCircle, PlusCircle } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerUser();

  if (!session) {
    redirect("/admin/login");
  }

  const role = session.role;

  return (
    <div className="flex min-h-[calc(100vh-68px)] bg-warm-cream flex-col md:flex-row pb-16 md:pb-0">
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="w-64 bg-white border-r border-[#E8E0D0] hidden md:flex flex-col shrink-0 font-sans">
        <div className="p-6 border-b border-[#E8E0D0]">
          <h2 className="font-display font-semibold text-lg text-navy-900">Dashboard</h2>
          <p className="text-xs text-navy-700 font-medium capitalize mt-0.5">{role.replace('_', ' ').toLowerCase()}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5">
          <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-2.5 text-navy-800 rounded-btn hover:bg-navy-50 hover:text-gold-600 transition-colors text-sm font-medium">
            <Home className="w-4 h-4 text-gold-500 shrink-0" />
            <span>Overview</span>
          </Link>
          
          {(role === "PROPERTY_LISTER" || role === "AGENT") && (
            <>
              <Link href="/dashboard/properties" className="flex items-center space-x-3 px-4 py-2.5 text-navy-800 rounded-btn hover:bg-navy-50 hover:text-gold-600 transition-colors text-sm font-medium">
                <List className="w-4 h-4 text-gold-500 shrink-0" />
                <span>My Properties</span>
              </Link>
              <Link href="/dashboard/properties/new" className="flex items-center space-x-3 px-4 py-2.5 text-navy-800 rounded-btn hover:bg-navy-50 hover:text-gold-600 transition-colors text-sm font-medium">
                <PlusCircle className="w-4 h-4 text-gold-500 shrink-0" />
                <span>Add Property</span>
              </Link>
            </>
          )}

          {role === "VENDOR" && (
            <Link href="/dashboard/profile" className="flex items-center space-x-3 px-4 py-2.5 text-navy-800 rounded-btn hover:bg-navy-50 hover:text-gold-600 transition-colors text-sm font-medium">
              <UserCircle className="w-4 h-4 text-gold-500 shrink-0" />
              <span>My Profile</span>
            </Link>
          )}
          
          <Link href="/dashboard/enquiries" className="flex items-center space-x-3 px-4 py-2.5 text-navy-800 rounded-btn hover:bg-navy-50 hover:text-gold-600 transition-colors text-sm font-medium">
            <MessageSquare className="w-4 h-4 text-gold-500 shrink-0" />
            <span>Enquiries</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Sticky Bottom Tab Bar (Hidden on Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E8E0D0] flex justify-around items-center py-2 pb-safe shadow-lg text-navy-800 font-sans">
        
        {/* Overview link */}
        <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-navy-750 hover:text-gold-600 transition-colors flex-1 py-1">
          <Home className="w-4.5 h-4.5 text-navy-800" />
          <span>Overview</span>
        </Link>
        
        {/* Center Add Button for Owners / Agents */}
        {(role === "PROPERTY_LISTER" || role === "AGENT") ? (
          <>
            <Link href="/dashboard/properties" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-navy-750 hover:text-gold-600 transition-colors flex-1 py-1">
              <List className="w-4.5 h-4.5 text-navy-800" />
              <span>Properties</span>
            </Link>
            
            {/* Pop-out FAB */}
            <Link href="/dashboard/properties/new" className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-navy-950 flex-1 relative -mt-4 active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-navy-900 text-gold-500 rounded-full flex items-center justify-center border-2 border-warm-cream shadow-md">
                <PlusCircle className="w-6 h-6 text-gold-500" />
              </div>
              <span className="mt-1 text-[9px] uppercase tracking-wider text-navy-900">Add New</span>
            </Link>
          </>
        ) : role === "VENDOR" ? (
          /* Profile link for Vendors */
          <Link href="/dashboard/profile" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-navy-750 hover:text-gold-600 transition-colors flex-1 py-1">
            <UserCircle className="w-4.5 h-4.5 text-navy-800" />
            <span>Profile</span>
          </Link>
        ) : null}
        
        {/* Enquiries link */}
        <Link href="/dashboard/enquiries" className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-navy-750 hover:text-gold-600 transition-colors flex-1 py-1">
          <MessageSquare className="w-4.5 h-4.5 text-navy-800" />
          <span>Enquiries</span>
        </Link>
      </div>

    </div>
  );
}
