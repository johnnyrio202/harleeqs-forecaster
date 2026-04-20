'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Scenario, ActualMonth } from '@/types/forecast';
import { makeDefaultScenario } from '@/lib/defaults';
import { fetchScenarios, saveScenario, deleteScenario, fetchActuals, upsertActual, type ScenarioRow } from '@/lib/supabase';

type ScenarioContextType = {
  activeScenario: Scenario;
  setActiveScenario: (s: Scenario) => void;
  savedScenarios: ScenarioRow[];
  actuals: ActualMonth[];
  loading: boolean;
  saving: boolean;
  save: () => Promise<void>;
  saveAs: (name: string) => Promise<void>;
  clone: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  load: (id: string) => void;
  addOrUpdateActual: (actual: ActualMonth) => Promise<void>;
  refresh: () => Promise<void>;
  hasActuals: boolean;
};

const ScenarioContext = createContext<ScenarioContextType | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [activeScenario, setActiveScenario] = useState<Scenario>(makeDefaultScenario());
  const [savedScenarios, setSavedScenarios] = useState<ScenarioRow[]>([]);
  const [actuals, setActuals] = useState<ActualMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const rows = await fetchScenarios();
      setSavedScenarios(rows);
    } catch {
      // Supabase not configured yet — work in local state only
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    fetchActuals(activeScenario.id)
      .then((rows) =>
        setActuals(
          rows.map((r) => ({
            id: r.id,
            venueId: r.venue_id,
            month: r.month,
            firstBowls: r.first_bowls,
            refills: r.refills,
            grossRevenue: Number(r.gross_revenue),
            notes: r.notes ?? undefined,
          }))
        )
      )
      .catch(() => {});
  }, [activeScenario.id]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const updated = { ...activeScenario, updatedAt: new Date().toISOString() };
      await saveScenario(updated);
      setActiveScenario(updated);
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [activeScenario, refresh]);

  const saveAs = useCallback(async (name: string) => {
    setSaving(true);
    try {
      const newScenario: Scenario = {
        ...activeScenario,
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveScenario(newScenario);
      setActiveScenario(newScenario);
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [activeScenario, refresh]);

  const clone = useCallback(async (id: string) => {
    const row = savedScenarios.find((r) => r.id === id);
    if (!row) return;
    setSaving(true);
    try {
      const cloned: Scenario = {
        ...row.data,
        id: crypto.randomUUID(),
        name: `${row.data.name} (copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveScenario(cloned);
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [savedScenarios, refresh]);

  const remove = useCallback(async (id: string) => {
    setSaving(true);
    try {
      await deleteScenario(id);
      if (activeScenario.id === id) {
        setActiveScenario(makeDefaultScenario());
      }
      await refresh();
    } finally {
      setSaving(false);
    }
  }, [activeScenario.id, refresh]);

  const load = useCallback((id: string) => {
    const row = savedScenarios.find((r) => r.id === id);
    if (row) setActiveScenario(row.data);
  }, [savedScenarios]);

  const addOrUpdateActual = useCallback(async (actual: ActualMonth) => {
    await upsertActual(activeScenario.id, actual);
    setActuals((prev) => {
      const idx = prev.findIndex((a) => a.venueId === actual.venueId && a.month === actual.month);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = actual;
        return next;
      }
      return [...prev, actual];
    });
  }, [activeScenario.id]);

  return (
    <ScenarioContext.Provider value={{
      activeScenario,
      setActiveScenario,
      savedScenarios,
      actuals,
      loading,
      saving,
      save,
      saveAs,
      clone,
      remove,
      load,
      addOrUpdateActual,
      refresh,
      hasActuals: actuals.length > 0,
    }}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used inside ScenarioProvider');
  return ctx;
}
