-- Run in the Supabase SQL editor. Public keys are safe only with these RLS policies.
create table if not exists public.sales_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 5000000),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.sales_workspaces enable row level security;
drop policy if exists "Read own workspace" on public.sales_workspaces;
create policy "Read own workspace" on public.sales_workspaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own workspace" on public.sales_workspaces;
create policy "Insert own workspace" on public.sales_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own workspace" on public.sales_workspaces;
create policy "Update own workspace" on public.sales_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
revoke all on public.sales_workspaces from anon;
grant select, insert, update on public.sales_workspaces to authenticated;
