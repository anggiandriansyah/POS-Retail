-- Sprint 2 Refinement (v1.2.0): Username login, Stock Requests, & Supabase Realtime

-- 1. Add username column to profiles & backfill existing rows
alter table public.profiles
  add column if not exists username text;

update public.profiles p
set username = lower(coalesce(nullif(trim(p.full_name), ''), split_part(u.email, '@', 1)))
from auth.users u
where u.id = p.id
  and (p.username is null or trim(p.username) = '');

create unique index if not exists uq_profiles_username_lower
  on public.profiles (lower(username));

-- Update handle_new_user trigger to store username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := 'kasir';
  v_base_username text;
  v_username text;
begin
  if not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
  end if;

  v_base_username := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  ));
  v_username := v_base_username;

  if exists (select 1 from public.profiles where lower(username) = v_username) then
    v_username := v_base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, full_name, username, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    v_username,
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- RPC to resolve username or email to email for Sign In
create or replace function public.resolve_login_email(p_identifier text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clean text := lower(trim(coalesce(p_identifier, '')));
  v_email text;
begin
  if v_clean = '' then
    return null;
  end if;

  if position('@' in v_clean) > 0 then
    return v_clean;
  end if;

  select u.email into v_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = v_clean
  limit 1;

  return v_email;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- 2. Stock Requests table (Kasir -> Owner)
create table if not exists public.stock_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  requested_qty integer not null default 10 check (requested_qty > 0),
  note text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'RESTOCKED', 'REJECTED')),
  owner_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_stock_requests_status_created
  on public.stock_requests (status, created_at desc);
create index if not exists idx_stock_requests_requested_by
  on public.stock_requests (requested_by, created_at desc);

alter table public.stock_requests enable row level security;

drop policy if exists "Stock requests select own or owner" on public.stock_requests;
create policy "Stock requests select own or owner"
  on public.stock_requests for select to authenticated
  using (requested_by = (select auth.uid()) or private.is_owner());

drop policy if exists "Stock requests insert active user" on public.stock_requests;
create policy "Stock requests insert active user"
  on public.stock_requests for insert to authenticated
  with check (private.is_active_user() and requested_by = (select auth.uid()));

drop policy if exists "Stock requests update owner only" on public.stock_requests;
create policy "Stock requests update owner only"
  on public.stock_requests for update to authenticated
  using (private.is_owner())
  with check (private.is_owner());

revoke all on table public.stock_requests from anon;
grant select, insert, update on table public.stock_requests to authenticated;

-- 3. Enable Supabase Realtime on operational tables
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shifts'
  ) then
    alter publication supabase_realtime add table public.shifts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stock_requests'
  ) then
    alter publication supabase_realtime add table public.stock_requests;
  end if;
end $$;

-- 4. Record version 1.2.0
insert into public.app_versions (version, phase, notes)
values (
  '1.2.0',
  'Fase 2 - Sprint 2 Refinement',
  'Username Login, Google/Confirm-Password Sign Up, Bilingual ID/EN, Dark/Light Mode, Digital Clock Shift, Realtime Owner Monitoring, Stock Requests'
)
on conflict (version) do nothing;
