-- Payments and notifications tables for resolution tracking

create table public.payments (
  id uuid default gen_random_uuid() primary key,
  claim_id text not null references public.claims(claim_id),
  amount numeric not null,
  policyholder text not null,
  method text not null default 'wire_transfer',
  status text not null default 'processed' check (status in ('pending', 'processed', 'failed')),
  created_at timestamptz default now()
);

create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  claim_id text not null references public.claims(claim_id),
  recipient_email text not null,
  type text not null default 'decision' check (type in ('decision', 'payment', 'closure')),
  subject text not null,
  body text not null,
  status text not null default 'sent' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz default now()
);

alter table public.payments enable row level security;
alter table public.notifications enable row level security;

create policy "Users can read own payments" on public.payments
  for select to authenticated
  using (claim_id in (select claim_id from public.claims where user_id = (select auth.uid())));

create policy "Users can read own notifications" on public.notifications
  for select to authenticated
  using (claim_id in (select claim_id from public.claims where user_id = (select auth.uid())));
