"use client";
// ═══════════════════════════════════════
// Tracker — Overview Tab
// ═══════════════════════════════════════
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { ReStatCard } from './re-ui';
import { re_getMonthKey, re_isThisMonth } from './re-hooks';
import { commissionSummary } from '@/lib/crm/commission';
import { formatINR, formatDateStr } from './formatters';
import type { RePerson, ReDeal, ReProperty, ReLedgerEntry, ReActivity } from './re-types';

const PIE_COLORS = ['#E39614', '#6FAEA7', '#1E8449', '#EFA92E', '#4A968E', '#C0392B'];

interface Props {
  people: RePerson[];
  deals: ReDeal[];
  properties: ReProperty[];
  ledger: ReLedgerEntry[];
  activities: ReActivity[];
}

export const ReOverviewTab: React.FC<Props> = ({ people, deals, properties, ledger, activities }) => {
  const stats = useMemo(() => {
    // One source for money: commission from deal terms, cash from the ledger.
    const summary = commissionSummary(deals, ledger);
    const totalCommEarned = summary.expected;
    const monthCollected = ledger.filter(e => e.direction === 'IN' && e.settled && re_isThisMonth(e.date || e.created_at)).reduce((s, e) => s + Number(e.amount), 0);
    const monthPending = summary.outstanding;
    const pipelineValue = deals.filter(d => d.status !== 'Completed' && d.status !== 'Dropped').reduce((s, d) => s + Number(d.property_value), 0);
    const activeDeals = deals.filter(d => d.status !== 'Completed' && d.status !== 'Dropped').length;
    const monthClosed = deals.filter(d => d.status === 'Completed' && re_isThisMonth(d.created_at)).length;
    const followUpsDue = deals.filter(d => {
      if (!d.follow_up_date || d.status === 'Completed' || d.status === 'Dropped') return false;
      return new Date(d.follow_up_date) <= new Date();
    }).length;
    const staleDeals = deals.filter(d => {
      if (d.status === 'Completed' || d.status === 'Dropped') return false;
      return (Date.now() - new Date(d.created_at).getTime()) > 7 * 86400000;
    }).length;
    return { totalCommEarned, monthCollected, monthPending, pipelineValue, activeDeals, monthClosed, followUpsDue, staleDeals };
  }, [ledger, deals]);

  // Monthly bar chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, 0);
    }
    ledger.forEach(e => {
      if (e.direction !== 'IN' || !e.settled) return;
      const key = re_getMonthKey(e.date || e.created_at);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(e.amount));
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [y, m] = k.split('-');
      return { month: new Date(+y, +m - 1).toLocaleString('en', { month: 'short' }), amount: v };
    });
  }, [ledger]);

  // Deal type pie
  const dealTypePie = useMemo(() => {
    const map = new Map<string, number>();
    deals.forEach(d => map.set(d.deal_type, (map.get(d.deal_type) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {(stats.followUpsDue > 0 || stats.staleDeals > 0) && (
        <div id="re-alerts" className="flex flex-wrap gap-3">
          {stats.followUpsDue > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/10 border border-orange-500/30 rounded-xl text-sm text-orange-400">
              <AlertCircle size={16} /> <span className="font-semibold">{stats.followUpsDue}</span> follow-up(s) due today or overdue
            </div>
          )}
          {stats.staleDeals > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400">
              <Clock size={16} /> <span className="font-semibold">{stats.staleDeals}</span> deal(s) stale for 7+ days
            </div>
          )}
        </div>
      )}

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReStatCard icon="💰" label="Total Expected Commission" value={formatINR(stats.totalCommEarned)} accent />
        <ReStatCard icon="📥" label="This Month Collected" value={formatINR(stats.monthCollected)} />
        <ReStatCard icon="⏳" label="Still to collect" value={formatINR(stats.monthPending)} />
        <ReStatCard icon="📊" label="Pipeline Value" value={formatINR(stats.pipelineValue)} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ReStatCard icon="👥" label="People" value={people.length} />
        <ReStatCard icon="🤝" label="Active Deals" value={stats.activeDeals} />
        <ReStatCard icon="🏘" label="Properties" value={properties.length} />
        <ReStatCard icon={<TrendingUp size={20} className="text-emerald-400" />} label="Closed This Month" value={stats.monthClosed} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Commission Bar */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Monthly Commission (Last 6 Months)</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: '#0C2B29', border: '1px solid #1A524C', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="amount" fill="#E39614" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deal Type Donut */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
          <h4 className="font-heading font-bold text-white mb-4">Deals by Type</h4>
          {dealTypePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={dealTypePie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {dealTypePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0C2B29', border: '1px solid #1A524C', borderRadius: 12, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-500 text-sm">No deals yet</div>
          )}
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {dealTypePie.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-5">
        <h4 className="font-heading font-bold text-white mb-4">Recent Activity</h4>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet. Start adding people, deals, or properties.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-start gap-3 py-2 border-b border-brand-border/50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-brand-re mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300"><span className="font-semibold text-white">{a.action}</span> — {a.entity}</p>
                  <p className="text-xs text-gray-500">{formatDateStr(a.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
