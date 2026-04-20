create table scenarios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table actuals (
  id uuid primary key default gen_random_uuid(),
  venue_id text not null,
  scenario_id uuid references scenarios(id) on delete cascade,
  month text not null,
  first_bowls integer not null,
  refills integer not null,
  gross_revenue numeric not null,
  notes text,
  created_at timestamptz default now(),
  unique(scenario_id, venue_id, month)
);

create index actuals_scenario_idx on actuals(scenario_id);

alter table scenarios enable row level security;
alter table actuals enable row level security;

create policy "allow all for authenticated users" on scenarios
  for all using (auth.role() = 'authenticated');

create policy "allow all for authenticated users" on actuals
  for all using (auth.role() = 'authenticated');
