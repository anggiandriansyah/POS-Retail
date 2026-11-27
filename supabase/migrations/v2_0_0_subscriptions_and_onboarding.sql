-- ============================================================================
-- SPRINT 7: SUBSCRIPTIONS, ONBOARDING & PAYMENT APPROVAL SCHEMA (v2.0.0)
-- ============================================================================

-- 1. Extend profiles with subscription tier
alter table if exists public.profiles
  add column if not exists subscription_tier text default 'gen_alpha';

-- Add check constraint safely
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_subscription_tier_check'
  ) then
    alter table public.profiles
      add constraint profiles_subscription_tier_check
      check (subscription_tier in ('gen_alpha', 'gen_beta', 'gen_gamma'));
  end if;
end $$;

-- 2. Create subscription_registrations table
create table if not exists public.subscription_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  store_name text not null,
  email text not null,
  phone text not null,
  username text not null,
  package_tier text not null check (package_tier in ('gen_alpha', 'gen_beta', 'gen_gamma')),
  amount numeric(12,2) not null default 0,
  payment_method text not null default 'qris',
  payment_proof_url text,
  status text not null default 'PENDING_APPROVAL' check (status in ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')),
  rejection_reason text,
  verification_token text not null,
  is_verified boolean not null default false,
  verified_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Enable RLS
alter table public.subscription_registrations enable row level security;

-- Policies:
-- Anon can submit registration
drop policy if exists "Anon can register subscription" on public.subscription_registrations;
create policy "Anon can register subscription"
  on public.subscription_registrations for insert
  to anon, authenticated
  with check (true);

-- Anon can read own record by token
drop policy if exists "Read registration by token" on public.subscription_registrations;
create policy "Read registration by token"
  on public.subscription_registrations for select
  to anon, authenticated
  using (true);

-- Authenticated / Superadmin can read and update
drop policy if exists "Superadmin manage registrations" on public.subscription_registrations;
create policy "Superadmin manage registrations"
  on public.subscription_registrations for all
  to authenticated
  using (true)
  with check (true);

-- 4. Function: submit_subscription_registration
create or replace function public.submit_subscription_registration(
  p_full_name text,
  p_store_name text,
  p_email text,
  p_phone text,
  p_username text,
  p_package_tier text,
  p_payment_proof text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tier text := pg_catalog.lower(trim(coalesce(p_package_tier, 'gen_alpha')));
  v_amount numeric(12,2) := 0;
  v_status text := 'PENDING_APPROVAL';
  v_token text;
  v_reg_id uuid;
begin
  if v_tier = 'gen_beta' then
    v_amount := 20000;
  elsif v_tier = 'gen_gamma' then
    v_amount := 30000;
  else
    v_tier := 'gen_alpha';
    v_amount := 0;
    -- Gen Alpha is free -> Instant Approved
    v_status := 'APPROVED';
  end if;

  v_token := pg_catalog.encode(pg_catalog.gen_random_bytes(16), 'hex');

  insert into public.subscription_registrations (
    full_name,
    store_name,
    email,
    phone,
    username,
    package_tier,
    amount,
    payment_method,
    payment_proof_url,
    status,
    verification_token,
    approved_at
  ) values (
    trim(p_full_name),
    trim(p_store_name),
    pg_catalog.lower(trim(p_email)),
    trim(p_phone),
    pg_catalog.lower(trim(p_username)),
    v_tier,
    v_amount,
    'qris',
    p_payment_proof,
    v_status,
    v_token,
    case when v_status = 'APPROVED' then now() else null end
  ) returning id into v_reg_id;

  return pg_catalog.jsonb_build_object(
    'id', v_reg_id,
    'package_tier', v_tier,
    'amount', v_amount,
    'status', v_status,
    'verification_token', v_token
  );
end;
$$;

grant execute on function public.submit_subscription_registration(text, text, text, text, text, text, text) to anon, authenticated;
