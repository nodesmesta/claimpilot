create table public.assets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  policyholder text not null,
  policy_number text not null,
  policy_type text,
  effective_date date,
  expiration_date date,
  premium text,
  vehicle_description text,
  vin text,
  license_plate text,
  estimated_value numeric,
  deductible numeric,
  coverage_collision text,
  coverage_comprehensive text,
  coverage_liability text,
  payment_method text,
  billing_cycle text,
  claims_history_total int default 0,
  claims_history_12mo int default 0,
  raw_text text,
  created_at timestamptz default now()
);

alter table public.assets enable row level security;

create policy "Users can read own assets" on public.assets
  for select to authenticated
  using (user_id = (select auth.uid()));
