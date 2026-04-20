import { createBrowserClient } from '@supabase/ssr';
import type { Scenario, ActualMonth } from '@/types/forecast';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type ScenarioRow = {
  id: string;
  name: string;
  data: Scenario;
  created_at: string;
  updated_at: string;
};

export type ActualRow = {
  id: string;
  venue_id: string;
  scenario_id: string;
  month: string;
  first_bowls: number;
  refills: number;
  gross_revenue: number;
  notes: string | null;
  created_at: string;
};

export async function fetchScenarios(): Promise<ScenarioRow[]> {
  const client = createClient();
  const { data, error } = await client.from('scenarios').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveScenario(scenario: Scenario): Promise<ScenarioRow> {
  const client = createClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('scenarios')
    .upsert({ id: scenario.id, name: scenario.name, data: scenario, updated_at: now })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScenario(id: string): Promise<void> {
  const client = createClient();
  const { error } = await client.from('scenarios').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchActuals(scenarioId: string): Promise<ActualRow[]> {
  const client = createClient();
  const { data, error } = await client.from('actuals').select('*').eq('scenario_id', scenarioId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertActual(scenarioId: string, actual: ActualMonth): Promise<void> {
  const client = createClient();
  const { error } = await client.from('actuals').upsert({
    id: actual.id,
    scenario_id: scenarioId,
    venue_id: actual.venueId,
    month: actual.month,
    first_bowls: actual.firstBowls,
    refills: actual.refills,
    gross_revenue: actual.grossRevenue,
    notes: actual.notes ?? null,
  });
  if (error) throw error;
}
