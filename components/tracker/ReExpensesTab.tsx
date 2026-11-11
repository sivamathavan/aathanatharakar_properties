"use client";
// ═══════════════════════════════════════
// Tracker — Expenses Tab (real estate only)
// ═══════════════════════════════════════
import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { re_id, type ReExpense } from './re-types';
import { ReModal, ReEmptyState, ReFormField, ReConfirm, ReStatCard, reInputClass } from './re-ui';
import { re_isThisMonth } from './re-hooks';
import { formatINR, formatDateStr } from './formatters';
import { exportToCSV } from './exportHelpers';
import type { ReLedgerEntry } from './re-types';

const CATEGORIES = ['Petrol', 'Travel', 'Rent', 'Phone & WiFi', 'Electricity', 'Salary', 'Food', 'Marketing', 'Portal listings', 'Legal & documents', 'Office supplies', 'Software', 'Other'];
const MODES = ['Cash', 'UPI', 'Bank transfer', 'Card'];
const TYPE_LABEL = { EXPENSE: 'Expense', INVESTMENT: 'Investment', DRAWING: 'Owner drawing' } as const;
const PIE_COLORS = ['#E39614', '#6FAEA7', '#1E8449', '#EFA92E', '#4A968E', '#C0392B', '#9CC7C2', '#C47C0B'];

interface Props {
  expenses: ReExpense[];
  ledger: ReLedgerEntry[];
  onSave: (e: ReExpense, isEdit: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const blank = (): ReExpense => ({
  id: re_id(), expense_type: 'EXPENSE', category: 'Petrol', amount: 0, spent_by: '', description: '',
  date: new Date().toISOString().slice(0, 10), payment_mode: 'UPI', notes: '', created_at: '',
});

export const ReExpensesTab: React.FC<Props> = ({ expenses, ledger, onSave, onDelete }) => {
  const [form, setForm] = useState<ReExpense | null>(null);
  const [confirm, setConfirm] = useState<ReExpense | null>(null);
  const [onlyThisMonth, setOnlyThisMonth] = useState(true);

  const shown = onlyThisMonth ? expenses.filter(e => re_isThisMonth(e.date || e.created_at)) : expenses;
  // Profit uses cash actually received and paid, not expected commission.
  const stats = useMemo(() => {
    const sum = (t: ReExpense['expense_type']) => shown.filter(e => e.expense_type === t).reduce((s, e) => s + Number(e.amount), 0);
    const income = ledger
      .filter(e => e.direction === 'IN' && e.settled && (!onlyThisMonth || re_isThisMonth(e.date || e.created_at)))
      .reduce((s, e) => s + Number(e.amount), 0);
    const payouts = ledger
      .filter(e => e.direction === 'OUT' && e.settled && (!onlyThisMonth || re_isThisMonth(e.date || e.created_at)))
      .reduce((s, e) => s + Number(e.amount), 0);
    const spent = sum('EXPENSE');
    return { spent, invested: sum('INVESTMENT'), drawn: sum('DRAWING'), income, payouts, profit: income - payouts - spent };
  }, [shown, ledger, onlyThisMonth]);

  const pie = useMemo(() => {
    const map = new Map<string, number>();
    shown.filter(e => e.expense_type === 'EXPENSE').forEach(e => map.set(e.category, (map.get(e.category) || 0) + Number(e.amount)));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [shown]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 bg-brand-dark rounded-xl p-1">
          {[{ v: true, l: 'This month' }, { v: false, l: 'All time' }].map(o => (
            <button key={o.l} onClick={() => setOnlyThisMonth(o.v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${onlyThisMonth === o.v ? 'bg-brand-re text-navy-950' : 'text-gray-400'}`}>{o.l}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(shown.map(e => ({ Date: e.date, Type: TYPE_LABEL[e.expense_type], Category: e.category, Amount: e.amount, 'Spent by': e.spent_by, Mode: e.payment_mode, Description: e.description })), 'expenses')}
            className="flex items-center gap-2 px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-gray-300 hover:text-white"><Download size={14} /> CSV</button>
          <button onClick={() => setForm(blank())} className="flex items-center gap-2 px-4 py-2 bg-brand-re text-navy-950 rounded-xl text-sm font-semibold"><Plus size={16} /> Add expense</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReStatCard icon="📥" label="Commission received" value={formatINR(stats.income)} />
        <ReStatCard icon="💸" label="Expenses + payouts" value={formatINR(stats.spent + stats.payouts)} sub={`${formatINR(stats.spent)} spent · ${formatINR(stats.payouts)} paid out`} />
        <ReStatCard icon="📈" label="Profit" value={formatINR(stats.profit)} accent />
        <ReStatCard icon="🏦" label="Invested / drawn" value={`${formatINR(stats.invested)} / ${formatINR(stats.drawn)}`} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {shown.length === 0 ? (
            <ReEmptyState icon="💸" title="No expenses" sub={onlyThisMonth ? 'Nothing recorded this month' : 'Record petrol, rent, salaries and more'} />
          ) : (
            <div className="space-y-2">
              {shown.map(e => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 bg-brand-card border border-brand-border rounded-xl p-4">
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-sm font-semibold text-white">{e.category} <span className="text-xs text-gray-500 font-normal">· {TYPE_LABEL[e.expense_type]}</span></p>
                    <p className="text-xs text-gray-400">{formatDateStr(e.date)}{e.spent_by ? ` • ${e.spent_by}` : ''}{e.description ? ` • ${e.description}` : ''}</p>
                  </div>
                  <span className="font-bold text-orange-400">{formatINR(e.amount)}</span>
                  <button onClick={() => setForm({ ...e })} className="text-xs text-gray-400 hover:text-white">Edit</button>
                  <button onClick={() => setConfirm(e)} aria-label="Delete expense" className="p-1.5 rounded-lg text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-4">
          <h4 className="font-heading font-bold text-white mb-2 text-sm">Where the money went</h4>
          {pie.length === 0 ? <p className="text-xs text-gray-500">No expenses to chart.</p> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} stroke="none">
                    {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: '#0C2B29', border: '1px solid #1A524C', borderRadius: 8, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="space-y-1 text-xs">
                {pie.map((p, i) => (
                  <li key={p.name} className="flex justify-between text-gray-300">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{p.name}</span>
                    <span>{formatINR(p.value)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <ReModal open={!!form} onClose={() => setForm(null)} title={form?.created_at ? 'Edit expense' : 'Add expense'}>
        {form && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReFormField label="Type">
                <select className={reInputClass} value={form.expense_type} onChange={e => setForm({ ...form, expense_type: e.target.value as ReExpense['expense_type'] })}>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </ReFormField>
              <ReFormField label="Category">
                <select className={reInputClass} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </ReFormField>
              <ReFormField label="Amount (₹) *">
                <input className={reInputClass} type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} />
              </ReFormField>
              <ReFormField label="Date">
                <input className={reInputClass} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </ReFormField>
              <ReFormField label="Spent by">
                <input className={reInputClass} value={form.spent_by} onChange={e => setForm({ ...form, spent_by: e.target.value })} />
              </ReFormField>
              <ReFormField label="Paid by">
                <select className={reInputClass} value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                  {MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </ReFormField>
              <ReFormField label="What for" span={2}>
                <input className={reInputClass} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </ReFormField>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
              <button onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-brand-border">Cancel</button>
              <button disabled={form.amount <= 0} onClick={async () => { if (await onSave(form, !!form.created_at)) setForm(null); }} className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re text-navy-950 disabled:opacity-50">Save</button>
            </div>
          </>
        )}
      </ReModal>

      <ReConfirm open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => (confirm ? onDelete(confirm.id) : false)} title="Delete this expense?" message={confirm ? `${confirm.category} — ${formatINR(confirm.amount)}` : ''} />
    </div>
  );
};
