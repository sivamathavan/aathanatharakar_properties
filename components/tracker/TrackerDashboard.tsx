"use client";

import React, { useState } from "react";
import { Home, Users, Handshake, Building2, Landmark, BarChart2, Wallet, Zap, Loader2 } from "lucide-react";
import { type ReTabKey, type ReLedgerEntry } from "./re-types";
import { useReData } from "./re-hooks";
import { ReOverviewTab } from "./ReOverviewTab";
import { RePeopleTab } from "./RePeopleTab";
import { ReDealsTab } from "./ReDealsTab";
import { RePropertiesTab } from "./RePropertiesTab";
import { ReCommissionTab } from "./ReCommissionTab";
import { ReAnalyticsTab } from "./ReAnalyticsTab";
import { ReMatchTab } from "./ReMatchTab";
import { ReExpensesTab } from "./ReExpensesTab";

const TABS = [
  { key: "overview", label: "Overview", icon: Home },
  { key: "people", label: "People & Network", icon: Users },
  { key: "deals", label: "Deals", icon: Handshake },
  { key: "properties", label: "Properties", icon: Building2 },
  { key: "match", label: "Buyer Match", icon: Zap },
  { key: "commission", label: "Commission", icon: Landmark },
  { key: "analytics", label: "Analytics", icon: BarChart2 },
  { key: "expenses", label: "Expenses", icon: Wallet },
] as const;

// The back office, moved from the tracker app. Admin only (page, API and rules).
export function TrackerDashboard({ gstRegistered }: { gstRegistered: boolean }) {
  const [activeTab, setActiveTab] = useState<ReTabKey>("overview");
  const data = useReData();

  // Money in/out changes each deal's "received", so refresh deals after it.
  const saveLedger = async (e: ReLedgerEntry, isEdit: boolean) => {
    const ok = await data.saveLedger(e, isEdit);
    if (ok) await data.refreshDeals();
    return ok;
  };
  const deleteLedger = async (id: string) => {
    const ok = await data.deleteLedger(id);
    if (ok) await data.refreshDeals();
    return ok;
  };

  return (
    <div className="bg-brand-dark text-white rounded-2xl p-4 md:p-6 space-y-6 min-h-[70vh]">
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-brand-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.key ? "bg-brand-re/15 text-brand-re border border-brand-re/40" : "bg-brand-card border border-brand-border text-gray-400 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…</div>
      ) : (
        <>
          {activeTab === "overview" && <ReOverviewTab people={data.people} deals={data.deals} properties={data.properties} ledger={data.ledger} activities={data.activities} />}
          {activeTab === "people" && <RePeopleTab people={data.people} properties={data.properties} onSave={data.re_savePerson} onDelete={data.re_deletePerson} onTogglePin={data.re_togglePinPerson} onActivity={data.logActivity} />}
          {activeTab === "deals" && <ReDealsTab deals={data.deals} onSave={data.re_saveDeal} onDelete={data.re_deleteDeal} onUpdateStatus={data.re_updateDealStatus} onActivity={data.logActivity} />}
          {activeTab === "properties" && (
            <RePropertiesTab
              properties={data.properties}
              onChanged={(p) => data.setProperties((prev) => prev.map((x) => (x.id === p.id ? p : x)))}
              onActivity={data.logActivity}
            />
          )}
          {activeTab === "match" && <ReMatchTab people={data.people} properties={data.properties} />}
          {activeTab === "commission" && <ReCommissionTab deals={data.deals} people={data.people} ledger={data.ledger} gstRegistered={gstRegistered} onSave={saveLedger} onDelete={deleteLedger} onActivity={data.logActivity} />}
          {activeTab === "analytics" && <ReAnalyticsTab people={data.people} deals={data.deals} properties={data.properties} />}
          {activeTab === "expenses" && <ReExpensesTab expenses={data.expenses} ledger={data.ledger} onSave={data.saveExpense} onDelete={data.deleteExpense} />}
        </>
      )}
    </div>
  );
}
