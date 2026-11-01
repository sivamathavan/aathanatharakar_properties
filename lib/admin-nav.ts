import { LayoutDashboard, Home, Zap, Users2, IndianRupee, Settings, BriefcaseBusiness, BarChart3 } from "lucide-react";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/properties", label: "Properties", icon: Home },
  { href: "/admin/leads", label: "Website enquiries", icon: Zap },
  { href: "/admin/agents", label: "Agents", icon: Users2 },
  { href: "/admin/payments", label: "Payments", icon: IndianRupee },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Plans & settings", icon: Settings },
  { href: "/admin/tracker", label: "Tracker", icon: BriefcaseBusiness },
];
