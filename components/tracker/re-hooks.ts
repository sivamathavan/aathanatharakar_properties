// ═══════════════════════════════════════
// Tracker — data hooks (admin API backed)
// ═══════════════════════════════════════
"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { RePerson, ReDeal, ReProperty, ReLedgerEntry, ReExpense, ReActivity } from "./re-types";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/crm/${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`);
  return res.json();
}

const strip = ({ id, created_at, commission_amount, commission_received, ...rest }: any) => rest;

export function useReData() {
  const [people, setPeople] = useState<RePerson[]>([]);
  const [deals, setDeals] = useState<ReDeal[]>([]);
  const [properties, setProperties] = useState<ReProperty[]>([]);
  const [ledger, setLedger] = useState<ReLedgerEntry[]>([]);
  const [expenses, setExpenses] = useState<ReExpense[]>([]);
  const [activities, setActivities] = useState<ReActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [ppl, dls, props, led, exp, acts] = await Promise.all([
        api<{ data: RePerson[] }>("people"),
        api<{ data: ReDeal[] }>("deals"),
        api<{ data: ReProperty[] }>("properties"),
        api<{ data: ReLedgerEntry[] }>("ledger"),
        api<{ data: ReExpense[] }>("expenses"),
        api<{ data: ReActivity[] }>("activity"),
      ]);
      setPeople(ppl.data);
      setDeals(dls.data);
      setProperties(props.data);
      setLedger(led.data);
      setExpenses(exp.data);
      setActivities(acts.data);
    } catch (e: any) {
      toast.error(e.message || "Could not load the tracker");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logActivity = useCallback((action: string, entity: string, entity_id: string) => {
    api<{ data: ReActivity }>("activity", { method: "POST", body: JSON.stringify({ action, entity, entity_id }) })
      .then((res) => setActivities((prev) => [res.data, ...prev].slice(0, 200)))
      .catch(() => {});
  }, []);

  // Generic save for list collections: create returns the server row, edit merges it.
  function saver<T extends { id: string }>(collection: string, setList: React.Dispatch<React.SetStateAction<T[]>>, label: string) {
    return async (row: T, isEdit: boolean) => {
      try {
        if (isEdit) {
          const res = await api<{ data: Partial<T> }>(`${collection}/${row.id}`, { method: "PUT", body: JSON.stringify(strip(row)) });
          setList((prev) => prev.map((x) => (x.id === row.id ? ({ ...x, ...res.data } as T) : x)));
        } else {
          const res = await api<{ data: T }>(collection, { method: "POST", body: JSON.stringify(strip(row)) });
          setList((prev) => [res.data, ...prev]);
        }
        toast.success(isEdit ? `${label} updated` : `${label} added`);
        return true;
      } catch (e: any) {
        toast.error(e.message || `Could not save ${label.toLowerCase()}`);
        return false;
      }
    };
  }

  function deleter<T extends { id: string }>(collection: string, setList: React.Dispatch<React.SetStateAction<T[]>>, label: string) {
    return async (id: string) => {
      try {
        await api(`${collection}/${id}`, { method: "DELETE" });
        setList((prev) => prev.filter((x) => x.id !== id));
        toast.success(`${label} removed`);
      } catch (e: any) {
        toast.error(e.message || `Could not remove ${label.toLowerCase()}`);
      }
    };
  }

  const re_savePerson = useCallback(saver<RePerson>("people", setPeople, "Person"), []);
  const re_deletePerson = useCallback(deleter<RePerson>("people", setPeople, "Person"), []);
  const re_saveDeal = useCallback(saver<ReDeal>("deals", setDeals, "Deal"), []);
  const re_deleteDeal = useCallback(deleter<ReDeal>("deals", setDeals, "Deal"), []);
  const saveLedger = useCallback(saver<ReLedgerEntry>("ledger", setLedger, "Entry"), []);
  const deleteLedger = useCallback(deleter<ReLedgerEntry>("ledger", setLedger, "Entry"), []);
  const saveExpense = useCallback(saver<ReExpense>("expenses", setExpenses, "Expense"), []);
  const deleteExpense = useCallback(deleter<ReExpense>("expenses", setExpenses, "Expense"), []);

  const re_togglePinPerson = useCallback(
    async (id: string) => {
      const person = people.find((p) => p.id === id);
      if (!person) return;
      try {
        await api(`people/${id}`, { method: "PUT", body: JSON.stringify({ pinned: !person.pinned }) });
        setPeople((prev) => prev.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)));
      } catch {
        toast.error("Could not pin");
      }
    },
    [people]
  );

  const re_updateDealStatus = useCallback(async (id: string, status: ReDeal["status"]) => {
    try {
      await api(`deals/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
      setDeals((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch {
      toast.error("Could not update the stage");
    }
  }, []);

  /** Ledger changes move a deal's "received" figure, so refresh deals after them. */
  const refreshDeals = useCallback(async () => {
    try {
      setDeals((await api<{ data: ReDeal[] }>("deals")).data);
    } catch {
      /* keep current list */
    }
  }, []);

  return {
    loading,
    people, deals, properties, ledger, expenses, activities,
    setProperties,
    re_savePerson, re_deletePerson, re_togglePinPerson,
    re_saveDeal, re_deleteDeal, re_updateDealStatus,
    saveLedger, deleteLedger, saveExpense, deleteExpense,
    logActivity, fetchData, refreshDeals,
  };
}

export function re_calcDocScore(checklist: Record<string, string>): number {
  const vals = Object.values(checklist || {});
  if (vals.length === 0) return 0;
  const done = vals.filter((v) => v === "Received" || v === "Verified").length;
  return Math.round((done / vals.length) * 100);
}

export function re_getMonthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function re_isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
