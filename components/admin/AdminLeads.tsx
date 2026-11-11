"use client";

import { useState } from "react";
import Link from "next/link";
import { toast, errorText } from "@/lib/notify";
import { Handshake } from "lucide-react";
import { LeadsInbox } from "@/components/dashboard/LeadsInbox";

export function AdminLeads({ leads }: { leads: any[] }) {
  const [converted, setConverted] = useState<Record<string, boolean>>({});

  const convert = async (id: string) => {
    const res = await fetch(`/api/admin/leads/${id}/convert`, { method: "POST" });
    if (!res.ok) return void toast.error(await errorText(res, "Could not create the deal."));
    const data = await res.json();
    setConverted((c) => ({ ...c, [id]: true }));
    toast.success(data.existed ? "This enquiry already has a deal in the Tracker." : "Deal created in the Tracker.");
  };

  return (
    <LeadsInbox
      leads={leads}
      propertyBase="/properties"
      apiBase="/api/admin/leads"
      extraActions={(lead) =>
        converted[lead.id] ? (
          <Link href="/admin/tracker" className="h-9 px-3 rounded-btn border border-gold-500 text-gold-700 text-sm font-semibold inline-flex items-center gap-1.5">
            <Handshake className="w-4 h-4" /> Open tracker
          </Link>
        ) : (
          <button type="button" onClick={() => convert(lead.id)} className="h-9 px-3 rounded-btn border border-gold-500 text-gold-700 text-sm font-semibold inline-flex items-center gap-1.5">
            <Handshake className="w-4 h-4" /> Convert to deal
          </button>
        )
      }
    />
  );
}
