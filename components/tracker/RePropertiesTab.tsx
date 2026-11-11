"use client";
// ═══════════════════════════════════════
// Tracker — Properties Tab
// Your own listings (the same records the website shows), with the private
// owner details and the title-document checklist. Add and edit through the
// listing form so there is one record per property.
// ═══════════════════════════════════════
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Download, MapPin, ExternalLink, FileCheck2, Upload, Eye } from 'lucide-react';
import { toast, errorText } from "@/lib/notify";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { RE_PROPERTY_TYPES, RE_PROPERTY_STATUSES, RE_DOC_ITEMS, type ReProperty } from './re-types';
import { ReModal, ReSearchInput, ReSelect, ReBadge, ReEmptyState, ReDocScoreBar, reInputClass } from './re-ui';
import { re_calcDocScore } from './re-hooks';
import { formatINR } from './formatters';
import { exportToCSV } from './exportHelpers';

type DocState = { status: 'PENDING' | 'RECEIVED' | 'VERIFIED'; filePath?: string | null };

const TO_API = { Pending: 'PENDING', Received: 'RECEIVED', Verified: 'VERIFIED' } as const;
const FROM_API = { PENDING: 'Pending', RECEIVED: 'Received', VERIFIED: 'Verified' } as const;

interface Props {
  properties: ReProperty[];
  onChanged: (p: ReProperty) => void;
  onActivity: (action: string, entity: string, id: string) => void;
}

export const RePropertiesTab: React.FC<Props> = ({ properties, onChanged, onActivity }) => {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [docsFor, setDocsFor] = useState<ReProperty | null>(null);
  const [docs, setDocs] = useState<Record<string, DocState>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return properties.filter(p =>
      (!q || `${p.title} ${p.area} ${p.district} ${p.owner_name} ${p.survey_number}`.toLowerCase().includes(q)) &&
      (!type || p.property_type === type) &&
      (!status || p.status === status));
  }, [properties, search, type, status]);

  const openDocs = (p: ReProperty) => {
    const state: Record<string, DocState> = {};
    for (const item of RE_DOC_ITEMS) state[item] = { status: TO_API[p.doc_checklist[item] || 'Pending'], filePath: p.doc_files[item] || null };
    setDocs(state);
    setDocsFor(p);
  };

  const saveDocs = async (next: Record<string, DocState>, p: ReProperty) => {
    const res = await fetch(`/api/admin/crm/properties/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docChecklist: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, { status: v.status, filePath: v.filePath || null, fileUrl: null }])) }),
    });
    if (!res.ok) {
      toast.error(await errorText(res, 'Could not save the documents.'));
      return false;
    }
    const checklist = Object.fromEntries(Object.entries(next).map(([k, v]) => [k, FROM_API[v.status]])) as ReProperty['doc_checklist'];
    const files = Object.fromEntries(Object.entries(next).filter(([, v]) => v.filePath).map(([k, v]) => [k, v.filePath!]));
    onChanged({ ...p, doc_checklist: checklist, doc_files: files });
    return true;
  };

  const upload = async (item: string, file?: File) => {
    if (!file || !docsFor) return;
    if (file.size > 15 * 1024 * 1024) return void toast.error('The file must be under 15 MB.');
    setBusy(item);
    try {
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `crm-docs/${docsFor.id}/${item.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${Date.now()}.${ext}`;
      await uploadBytes(ref(storage, path), file, { contentType: file.type || 'application/octet-stream' });
      const next = { ...docs, [item]: { status: docs[item].status === 'PENDING' ? 'RECEIVED' as const : docs[item].status, filePath: path } };
      if (await saveDocs(next, docsFor)) {
        setDocs(next);
        onActivity('Uploaded document', `${item} — ${docsFor.title}`, docsFor.id);
        toast.success(`${item} uploaded.`);
      }
    } catch {
      toast.error('Could not upload. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  // Document links are made on demand (admin-only by storage rules) and never stored.
  const view = async (path: string) => {
    try {
      window.open(await getDownloadURL(ref(storage, path)), '_blank', 'noopener');
    } catch {
      toast.error('Could not open the file. Please try again.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <ReSearchInput value={search} onChange={setSearch} placeholder="Search title, area, owner, survey no." />
          <ReSelect value={type} onChange={setType} options={RE_PROPERTY_TYPES} allLabel="All types" />
          <ReSelect value={status} onChange={setStatus} options={RE_PROPERTY_STATUSES} allLabel="All statuses" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(filtered.map(p => ({ Title: p.title, Type: p.property_type, Status: p.status, Price: p.price, Extent: p.extent, Area: p.area, District: p.district, Owner: p.owner_name, 'Owner phone': p.owner_mobile, 'Survey no': p.survey_number, 'Docs %': re_calcDocScore(p.doc_checklist) })), 'properties')}
            className="flex items-center gap-2 px-3 py-2 bg-brand-card border border-brand-border rounded-xl text-sm text-gray-300 hover:text-white"><Download size={14} /> CSV</button>
          <Link href="/admin/properties/new" className="flex items-center gap-2 px-4 py-2 bg-brand-re text-navy-950 rounded-xl text-sm font-semibold"><Plus size={16} /> Add property</Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <ReEmptyState icon="🏘" title={properties.length ? 'No properties match' : 'No properties yet'} sub="Properties you add are listed here with their documents" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-white truncate">{p.title}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={12} /> {p.area}, {p.district}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <ReBadge label={p.status} />
                  {p.on_website && <span className="text-[10px] text-brand-re font-semibold">On website · {p.view_count} views</span>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-gray-500">Price</p><p className="text-white font-semibold">{formatINR(p.price)}</p></div>
                <div><p className="text-gray-500">Extent</p><p className="text-white">{p.extent}</p></div>
                <div><p className="text-gray-500">Type</p><p className="text-white">{p.property_type}</p></div>
                <div><p className="text-gray-500">Owner</p><p className="text-white truncate">{p.owner_name || '—'}</p></div>
                <div><p className="text-gray-500">Survey no.</p><p className="text-white">{p.survey_number || '—'}</p></div>
                <div><p className="text-gray-500">Road</p><p className="text-white truncate">{p.road_facing || '—'}</p></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <ReDocScoreBar score={re_calcDocScore(p.doc_checklist)} />
                <div className="flex gap-1">
                  <button onClick={() => openDocs(p)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-brand-border hover:text-white"><FileCheck2 size={14} /> Documents</button>
                  <Link href={`/admin/properties/${p.id}/edit`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-gray-300 border border-brand-border hover:text-white"><Pencil size={14} /> Edit</Link>
                  {p.on_website && <a href={`/properties/${p.id}`} target="_blank" rel="noopener noreferrer" aria-label="View on website" className="p-1.5 rounded-lg text-gray-400 hover:text-white"><ExternalLink size={14} /></a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReModal open={!!docsFor} onClose={() => setDocsFor(null)} title={docsFor ? `Documents — ${docsFor.title}` : ''}>
        {docsFor && (
          <div className="space-y-2">
            {RE_DOC_ITEMS.map(item => (
              <div key={item} className="flex flex-wrap items-center gap-3 bg-brand-dark rounded-xl px-3 py-2">
                <span className="flex-1 min-w-[140px] text-sm text-white">{item}</span>
                <select aria-label={`${item} status`} className={`${reInputClass} w-32`} value={docs[item]?.status}
                  onChange={async e => {
                    const next = { ...docs, [item]: { ...docs[item], status: e.target.value as DocState['status'] } };
                    if (await saveDocs(next, docsFor)) setDocs(next);
                  }}>
                  <option value="PENDING">Pending</option>
                  <option value="RECEIVED">Received</option>
                  <option value="VERIFIED">Verified</option>
                </select>
                {docs[item]?.filePath && (
                  <button onClick={() => view(docs[item].filePath!)} className="flex items-center gap-1 text-xs text-brand-re"><Eye size={14} /> View</button>
                )}
                <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
                  <Upload size={14} /> {busy === item ? 'Uploading…' : docs[item]?.filePath ? 'Replace' : 'Upload'}
                  <input type="file" accept="image/*,application/pdf" className="sr-only" disabled={!!busy} onChange={e => upload(item, e.target.files?.[0])} />
                </label>
              </div>
            ))}
            <p className="text-xs text-gray-500 pt-2">Files are private to admins. Photos or PDFs up to 15 MB.</p>
          </div>
        )}
      </ReModal>
    </div>
  );
};
