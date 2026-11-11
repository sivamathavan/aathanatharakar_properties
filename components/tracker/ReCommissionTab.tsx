"use client";
// ═══════════════════════════════════════
// Tracker — Commission Tab
// One ledger: money in (commission received) and money out (payouts to
// co-brokers and partners). Expected commission comes from each deal's terms.
// ═══════════════════════════════════════
import React, { useMemo, useState } from 'react';
import { Calculator, Plus, Trash2, Download, CheckCircle2 } from 'lucide-react';
import { RE_DEAL_TYPES, RE_COMMISSION_PILLS, re_id, type ReCommPill, type ReDeal, type ReLedgerEntry, type RePerson } from './re-types';
import { ReModal, ReBadge, ReDealTypeBadge, ReEmptyState, ReFormField, ReConfirm, ReStatCard, reInputClass } from './re-ui';
import { formatINR, formatDateStr } from './formatters';
import { exportToCSV, exportToPDF } from './exportHelpers';
import { commissionSummary, dealCommission, invoiceBreakdown } from '@/lib/crm/commission';

interface Props {
  deals: ReDeal[];
  people: RePerson[];
  ledger: ReLedgerEntry[];
  gstRegistered: boolean;
  onSave: (e: ReLedgerEntry, isEdit: boolean) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onActivity: (action: string, entity: string, id: string) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const blank = (direction: 'IN' | 'OUT'): ReLedgerEntry => ({
  id: re_id(), direction, deal_id: '', deal_title: '', person_id: '', person_name: '', amount: 0,
  settled: true, tds_deducted: false, date: today(), mode: 'UPI', notes: '', created_at: '',
});

export const ReCommissionTab: React.FC<Props> = ({ deals, people, ledger, gstRegistered, onSave, onDelete, onActivity }) => {
  const [activePill, setActivePill] = useState<ReCommPill>('Calculator');
  const [calc, setCalc] = useState({ type: 'Both Side Broker', value: 0, seller: 1, buyer: 1, gst: gstRegistered, tds: false });
  const [form, setForm] = useState<ReLedgerEntry | null>(null);
  const [confirmDel, setConfirmDel] = useState<ReLedgerEntry | null>(null);

  const summary = useMemo(() => commissionSummary(deals, ledger), [deals, ledger]);
  const moneyIn = ledger.filter(e => e.direction === 'IN');
  const moneyOut = ledger.filter(e => e.direction === 'OUT');

  const calcDeal = dealCommission({ deal_type: calc.type, property_value: calc.value, commission_rate_seller: calc.seller, commission_rate_buyer: calc.buyer });
  const calcInvoice = invoiceBreakdown(calcDeal.total, { gstRegistered: calc.gst, tdsDeducted: calc.tds });

  const save = async () => {
    if (!form) return;
    const deal = deals.find(d => d.id === form.deal_id);
    const ok = await onSave({ ...form, deal_title: deal?.title || form.deal_title }, false);
    if (ok) {
      onActivity(form.direction === 'IN' ? 'Commission received' : 'Payout recorded', form.person_name, form.id);
      setForm(null);
    }
  };

  const markSettled = async (e: ReLedgerEntry) => {
    if (await onSave({ ...e, settled: true }, true)) onActivity(e.direction === 'IN' ? 'Marked received' : 'Marked paid', e.person_name, e.id);
  };

  const list = (rows: ReLedgerEntry[], kind: 'IN' | 'OUT') =>
    rows.length === 0 ? (
      <ReEmptyState icon={kind === 'IN' ? '📥' : '💸'} title={kind === 'IN' ? 'No money in yet' : 'No payouts yet'} sub={kind === 'IN' ? 'Record commission as it reaches your account' : 'Record what you pay co-brokers and partners'} />
    ) : (
      <div className="space-y-2">
        {rows.map(e => (
          <div key={e.id} className="flex flex-wrap items-center gap-3 bg-brand-card border border-brand-border rounded-xl p-4">
            <div className="flex-1 min-w-[160px]">
              <p className="text-sm font-semibold text-white">{e.person_name}</p>
              <p className="text-xs text-gray-400">{e.deal_title || 'No deal'} • {formatDateStr(e.date)}{e.mode ? ` • ${e.mode}` : ''}{e.tds_deducted ? ' • TDS deducted' : ''}</p>
            </div>
            <span className={`font-bold ${kind === 'IN' ? 'text-emerald-400' : 'text-orange-400'}`}>{formatINR(e.amount)}</span>
            <ReBadge label={e.settled ? (kind === 'IN' ? 'Received' : 'Completed') : 'Pending'} />
            {!e.settled && (
              <button onClick={() => markSettled(e)} aria-label={kind === 'IN' ? 'Mark received' : 'Mark paid'} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"><CheckCircle2 size={16} /></button>
            )}
            <button onClick={() => setConfirmDel(e)} aria-label="Delete entry" className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    );

  const addButton = (direction: 'IN' | 'OUT', label: string) => (
    <button onClick={() => setForm(blank(direction))} className="flex items-center gap-2 px-4 py-2 bg-brand-re hover:bg-brand-re/90 text-navy-950 rounded-xl text-sm font-semibold">
      <Plus size={16} /> {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {RE_COMMISSION_PILLS.map(pill => (
          <button key={pill} onClick={() => setActivePill(pill)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activePill === pill ? 'bg-brand-re text-navy-950' : 'bg-brand-card border border-brand-border text-gray-400 hover:text-white'}`}>
            {pill}
          </button>
        ))}
      </div>

      {activePill === 'Calculator' && (
        <div className="max-w-2xl bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Calculator className="text-brand-re" size={24} />
            <h4 className="font-heading font-bold text-white text-lg">Commission calculator</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <ReFormField label="Deal type">
              <select className={reInputClass} value={calc.type} onChange={e => setCalc({ ...calc, type: e.target.value })}>
                {RE_DEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </ReFormField>
            <ReFormField label="Property value (₹)">
              <input className={reInputClass} type="number" min={0} value={calc.value} onChange={e => setCalc({ ...calc, value: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Seller side rate %">
              <input className={reInputClass} type="number" step="0.1" min={0} value={calc.seller} disabled={calc.type === 'Buyer Side Only'} onChange={e => setCalc({ ...calc, seller: +e.target.value })} />
            </ReFormField>
            <ReFormField label="Buyer side rate %">
              <input className={reInputClass} type="number" step="0.1" min={0} value={calc.buyer} disabled={calc.type === 'Seller Side Only'} onChange={e => setCalc({ ...calc, buyer: +e.target.value })} />
            </ReFormField>
          </div>
          <div className="flex flex-wrap gap-4 mb-5 text-sm text-gray-300">
            <label className="flex items-center gap-2"><input type="checkbox" checked={calc.gst} onChange={e => setCalc({ ...calc, gst: e.target.checked })} /> I charge GST (18%)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={calc.tds} onChange={e => setCalc({ ...calc, tds: e.target.checked })} /> Client deducts TDS (2%, sec. 194H)</label>
          </div>
          <div className="bg-brand-dark rounded-xl p-4 space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Seller side</span><span className="text-white font-semibold">{formatINR(calcDeal.seller)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Buyer side</span><span className="text-white font-semibold">{formatINR(calcDeal.buyer)}</span></div>
            <div className="border-t border-brand-border pt-2 flex justify-between"><span className="text-gray-300 font-semibold">Your commission</span><span className="text-brand-re font-bold">{formatINR(calcInvoice.commission)}</span></div>
            {calc.gst && <div className="flex justify-between"><span className="text-gray-400">+ GST 18% (billed on top)</span><span className="text-white">{formatINR(calcInvoice.gst)}</span></div>}
            {calc.gst && <div className="flex justify-between"><span className="text-gray-400">Invoice total</span><span className="text-white">{formatINR(calcInvoice.invoiceTotal)}</span></div>}
            {calc.tds && <div className="flex justify-between"><span className="text-gray-400">− TDS kept by client (claim it in your return)</span><span className="text-red-400">{formatINR(calcInvoice.tds)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-400">Client pays you</span><span className="text-white font-semibold">{formatINR(calcInvoice.clientPays)}</span></div>
            {calc.gst && <div className="flex justify-between"><span className="text-gray-400">− GST you pay to the government</span><span className="text-red-400">{formatINR(calcInvoice.gstToGovernment)}</span></div>}
            <div className="border-t border-brand-border pt-2 flex justify-between"><span className="text-gray-300 font-semibold">In your bank after GST</span><span className="text-emerald-400 font-heading font-bold text-lg">{formatINR(calcInvoice.netInBank)}</span></div>
          </div>
        </div>
      )}

      {activePill === 'Deal Records' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ReStatCard icon="📊" label="Expected" value={formatINR(summary.expected)} accent />
            <ReStatCard icon="📥" label="Received" value={formatINR(summary.received)} />
            <ReStatCard icon="⏳" label="Still to collect" value={formatINR(summary.outstanding)} />
            <ReStatCard icon="🤝" label="Deals" value={deals.filter(d => d.status !== 'Dropped').length} />
          </div>
          <p className="text-xs text-gray-400">Expected commission comes from each deal&apos;s value and rates. Received comes from Money In.</p>
          {deals.length === 0 ? (
            <ReEmptyState icon="💰" title="No deals yet" sub="Add deals in the Deals tab" />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-brand-border">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-brand-card/80">
                    {['Deal', 'Type', 'Value', 'Expected', 'Received', 'Paid out', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/50">
                  {deals.filter(d => d.status !== 'Dropped').map(d => {
                    const row = summary.perDeal.get(d.id);
                    const status = !row || row.received === 0 ? 'Pending' : row.received >= row.expected ? 'Completed' : 'Partial';
                    return (
                      <tr key={d.id}>
                        <td className="px-4 py-3 text-white font-semibold max-w-[200px] truncate">{d.title}</td>
                        <td className="px-4 py-3"><ReDealTypeBadge type={d.deal_type} /></td>
                        <td className="px-4 py-3 text-gray-300">{formatINR(d.property_value)}</td>
                        <td className="px-4 py-3 text-brand-re font-semibold">{formatINR(row?.expected || 0)}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">{formatINR(row?.received || 0)}</td>
                        <td className="px-4 py-3 text-orange-400">{formatINR(row?.paidOut || 0)}</td>
                        <td className="px-4 py-3"><ReBadge label={status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activePill === 'Money In' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ReStatCard icon="📥" label="Received" value={formatINR(summary.received)} accent />
            <ReStatCard icon="⏳" label="Promised, not in yet" value={formatINR(summary.receivable)} />
            <ReStatCard icon="📑" label="Entries" value={moneyIn.length} />
          </div>
          <div className="flex justify-between items-center">
            <h4 className="font-heading font-bold text-white">Commission received</h4>
            {addButton('IN', 'Add money in')}
          </div>
          {list(moneyIn, 'IN')}
        </div>
      )}

      {activePill === 'Payouts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ReStatCard icon="💸" label="Paid out" value={formatINR(summary.paidOut)} accent />
            <ReStatCard icon="⏳" label="Still to pay" value={formatINR(summary.payable)} />
            <ReStatCard icon="📑" label="Entries" value={moneyOut.length} />
          </div>
          <div className="flex justify-between items-center">
            <h4 className="font-heading font-bold text-white">Payouts to co-brokers and partners</h4>
            {addButton('OUT', 'Add payout')}
          </div>
          {list(moneyOut, 'OUT')}
        </div>
      )}

      {activePill === 'Net Summary' && (
        <div className="max-w-xl space-y-4">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-3 text-sm">
            <h4 className="font-heading font-bold text-white text-lg mb-2">Net commission</h4>
            <div className="flex justify-between"><span className="text-gray-400">Expected from all live deals</span><span className="text-white font-semibold">{formatINR(summary.expected)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Received</span><span className="text-emerald-400 font-semibold">{formatINR(summary.received)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Still to collect</span><span className="text-yellow-400">{formatINR(summary.outstanding)}</span></div>
            <div className="border-t border-brand-border pt-2 flex justify-between"><span className="text-gray-400">Paid out</span><span className="text-orange-400 font-semibold">−{formatINR(summary.paidOut)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Still to pay out</span><span className="text-yellow-400">{formatINR(summary.payable)}</span></div>
            <div className="border-t-2 border-brand-re/30 pt-3 flex justify-between"><span className="text-white font-heading font-bold">Net in hand</span><span className="text-brand-re font-heading font-bold text-2xl">{formatINR(summary.netInHand)}</span></div>
            <p className="text-xs text-gray-500">Net in hand = received − paid out. Amounts exclude GST.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => exportToCSV([{ Expected: summary.expected, Received: summary.received, 'To collect': summary.outstanding, 'Paid out': summary.paidOut, 'To pay': summary.payable, 'Net in hand': summary.netInHand }], 'commission_summary')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-gray-300 hover:text-white">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={() => exportToPDF('Net commission summary', ['Metric', 'Amount'], [
              ['Expected', formatINR(summary.expected)], ['Received', formatINR(summary.received)], ['Still to collect', formatINR(summary.outstanding)],
              ['Paid out', formatINR(summary.paidOut)], ['Still to pay', formatINR(summary.payable)], ['Net in hand', formatINR(summary.netInHand)],
            ], 'commission_summary')}
              className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-gray-300 hover:text-white">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>
      )}

      <ReModal open={!!form} onClose={() => setForm(null)} title={form?.direction === 'IN' ? 'Add money in' : 'Add payout'}>
        {form && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReFormField label="Deal" span={2}>
                <select className={reInputClass} value={form.deal_id} onChange={e => setForm({ ...form, deal_id: e.target.value })}>
                  <option value="">No deal</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </ReFormField>
              <ReFormField label={form.direction === 'IN' ? 'Received from *' : 'Paid to *'}>
                <input className={reInputClass} list="re-people-names" value={form.person_name}
                  onChange={e => {
                    const match = people.find(p => p.name === e.target.value);
                    setForm({ ...form, person_name: e.target.value, person_id: match?.id || '' });
                  }} />
                <datalist id="re-people-names">{people.map(p => <option key={p.id} value={p.name} />)}</datalist>
              </ReFormField>
              <ReFormField label="Amount (₹, without GST) *">
                <input className={reInputClass} type="number" min={0} value={form.amount} onChange={e => setForm({ ...form, amount: +e.target.value })} />
              </ReFormField>
              <ReFormField label="Date">
                <input className={reInputClass} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </ReFormField>
              <ReFormField label="Paid by">
                <select className={reInputClass} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
                  {['UPI', 'Bank transfer', 'Cash', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                </select>
              </ReFormField>
              <ReFormField label="Notes" span={2}>
                <input className={reInputClass} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </ReFormField>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.settled} onChange={e => setForm({ ...form, settled: e.target.checked })} /> {form.direction === 'IN' ? 'Already received' : 'Already paid'}</label>
              {form.direction === 'IN' && <label className="flex items-center gap-2"><input type="checkbox" checked={form.tds_deducted} onChange={e => setForm({ ...form, tds_deducted: e.target.checked })} /> Client deducted TDS</label>}
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-brand-border">
              <button onClick={() => setForm(null)} className="px-4 py-2 rounded-xl text-sm text-gray-400 border border-brand-border hover:bg-white/5">Cancel</button>
              <button onClick={save} disabled={!form.person_name.trim() || form.amount <= 0} className="px-6 py-2 rounded-xl text-sm font-semibold bg-brand-re text-navy-950 disabled:opacity-50">Save</button>
            </div>
          </>
        )}
      </ReModal>

      <ReConfirm open={!!confirmDel} onClose={() => setConfirmDel(null)} onConfirm={() => (confirmDel ? onDelete(confirmDel.id) : false)}
        title="Delete this entry?" message={confirmDel ? `${confirmDel.person_name} — ${formatINR(confirmDel.amount)}` : ''} />
    </div>
  );
};
