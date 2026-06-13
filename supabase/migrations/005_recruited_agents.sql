-- Add recruited_agents column to track dynamic agent recruitment
alter table public.claims add column if not exists recruited_agents text[] default '{}';
