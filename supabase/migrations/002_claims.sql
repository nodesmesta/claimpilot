-- Claims table for storing insurance claim investigations
create table public.claims (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  claim_id text not null unique,
  room_id text not null,
  policyholder text not null,
  policy_type text,
  incident_type text,
  description text,
  claim_amount numeric,
  location text,
  incident_date date,
  filing_date date,
  witnesses int default 0,
  photos_submitted int default 0,
  prior_claims_12mo int default 0,
  police_report boolean default false,
  medical_claim boolean default false,
  status text not null default 'investigating' check (status in ('investigating', 'approved', 'partial_approved', 'denied')),
  risk_level text check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
  verdict text,
  settlement_amount numeric,
  fraud_score int,
  resolution_reasoning text,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.claims enable row level security;

-- Users can read their own claims
create policy "Users can read own claims" on public.claims
  for select to authenticated
  using (user_id = (select auth.uid()));
