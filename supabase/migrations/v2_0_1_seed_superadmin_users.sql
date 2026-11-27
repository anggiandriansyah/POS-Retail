-- ============================================================================
-- ALPHOS RELEASE v1.6.0: NATIVE SUPERADMIN SEEDING & ONBOARDING DDL (DEV & PROD)
-- ============================================================================

-- 1. Pastikan ekstensi pgcrypto aktif untuk hashing kata sandi bcrypt
create extension if not exists pgcrypto with schema extensions;

-- 2. Pastikan tabel app_versions mencatat versi 1.6.0 sesuai skema existing
insert into public.app_versions (version, phase, notes)
values (
  '1.6.0',
  'Fase 4 - Sprint 7',
  'B2B Subscriptions, ATM POS Simulator, Native Superadmin Onboarding & Multi-Tenant Ecosystem'
)
on conflict (version) do update set
  phase = excluded.phase,
  notes = excluded.notes;

-- 3. Perbarui constraint role pada profiles agar mendukung 'superadmin'
do $$
begin
  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles add constraint profiles_role_check
    check (role in ('owner', 'kasir', 'admin', 'user', 'superadmin'));
end $$;

-- 4. DDL Subscription Registrations (Sprint 7 / B2B Superadmin Hub)
alter table if exists public.profiles
  add column if not exists subscription_tier text default 'gen_alpha';

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

alter table public.subscription_registrations enable row level security;

drop policy if exists "Anon can register subscription" on public.subscription_registrations;
create policy "Anon can register subscription"
  on public.subscription_registrations for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Read registration by token" on public.subscription_registrations;
create policy "Read registration by token"
  on public.subscription_registrations for select
  to anon, authenticated
  using (true);

drop policy if exists "Superadmin manage registrations" on public.subscription_registrations;
create policy "Superadmin manage registrations"
  on public.subscription_registrations for all
  to authenticated
  using (true)
  with check (true);

-- 5. SEED SUPERADMIN DEV: admindev / Jakarta123
do $$
declare
  v_dev_id uuid := '00000000-0000-0000-0000-000000000001';
  v_dev_email text := 'admindev@alphagen.co.id';
  v_dev_user text := 'admindev';
  v_dev_pass text := 'Jakarta123';
begin
  if not exists (select 1 from auth.users where email = v_dev_email or id = v_dev_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, phone_change,
      email_change_token_current, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_dev_id, 'authenticated', 'authenticated', v_dev_email,
      extensions.crypt(v_dev_pass, extensions.gen_salt('bf')), now(),
      '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Superadmin DEV', 'username', v_dev_user), now(), now()
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt(v_dev_pass, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = jsonb_build_object('full_name', 'Superadmin DEV', 'username', v_dev_user),
        updated_at = now()
    where id = v_dev_id or email = v_dev_email;
  end if;

  insert into public.profiles (id, full_name, username, role, is_active, created_at, updated_at)
  values (v_dev_id, 'Superadmin DEV', v_dev_user, 'superadmin', true, now(), now())
  on conflict (id) do update set
    role = 'superadmin', username = v_dev_user, full_name = 'Superadmin DEV', is_active = true, updated_at = now();
end $$;

-- 6. SEED SUPERADMIN PROD: adminprod / Jakarta123
do $$
declare
  v_prod_id uuid := '00000000-0000-0000-0000-000000000002';
  v_prod_email text := 'adminprod@alphagen.co.id';
  v_prod_user text := 'adminprod';
  v_prod_pass text := 'Jakarta123';
begin
  if not exists (select 1 from auth.users where email = v_prod_email or id = v_prod_id) then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, recovery_token,
      email_change_token_new, email_change, phone_change,
      email_change_token_current, reauthentication_token,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_prod_id, 'authenticated', 'authenticated', v_prod_email,
      extensions.crypt(v_prod_pass, extensions.gen_salt('bf')), now(),
      '', '', '', '', '', '', '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Superadmin PROD', 'username', v_prod_user), now(), now()
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt(v_prod_pass, extensions.gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
        raw_user_meta_data = jsonb_build_object('full_name', 'Superadmin PROD', 'username', v_prod_user),
        updated_at = now()
    where id = v_prod_id or email = v_prod_email;
  end if;

  insert into public.profiles (id, full_name, username, role, is_active, created_at, updated_at)
  values (v_prod_id, 'Superadmin PROD', v_prod_user, 'superadmin', true, now(), now())
  on conflict (id) do update set
    role = 'superadmin', username = v_prod_user, full_name = 'Superadmin PROD', is_active = true, updated_at = now();
end $$;

-- 7. RPC Functions
create or replace function public.submit_subscription_registration(
  p_full_name text, p_store_name text, p_email text, p_phone text,
  p_username text, p_package_tier text, p_payment_proof text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_tier text := pg_catalog.lower(trim(coalesce(p_package_tier, 'gen_alpha')));
  v_amount numeric(12,2) := 0; v_status text := 'PENDING_APPROVAL';
  v_token text; v_reg_id uuid;
begin
  if v_tier = 'gen_beta' then v_amount := 20000;
  elsif v_tier = 'gen_gamma' then v_amount := 30000;
  else v_tier := 'gen_alpha'; v_amount := 0; v_status := 'APPROVED';
  end if;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.subscription_registrations (
    full_name, store_name, email, phone, username, package_tier, amount,
    payment_proof_url, status, verification_token, is_verified, verified_at, approved_at
  ) values (
    trim(p_full_name), trim(p_store_name), lower(trim(p_email)), trim(p_phone), lower(trim(p_username)),
    v_tier, v_amount, p_payment_proof, v_status, v_token, (v_tier = 'gen_alpha'),
    case when v_tier = 'gen_alpha' then now() else null end,
    case when v_tier = 'gen_alpha' then now() else null end
  ) returning id into v_reg_id;
  return jsonb_build_object('success', true, 'registration_id', v_reg_id, 'verification_token', v_token, 'status', v_status, 'package_tier', v_tier, 'amount', v_amount);
end; $$;
revoke all on function public.submit_subscription_registration(text, text, text, text, text, text, text) from public;
grant execute on function public.submit_subscription_registration(text, text, text, text, text, text, text) to anon, authenticated;

create or replace function public.verify_registration_token(p_token text) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_reg record;
begin
  select * into v_reg from public.subscription_registrations where verification_token = trim(p_token) limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Token verifikasi tidak valid.'); end if;
  if not v_reg.is_verified then
    update public.subscription_registrations set is_verified = true, verified_at = now(), updated_at = now() where id = v_reg.id;
  end if;
  return jsonb_build_object('success', true, 'registration_id', v_reg.id, 'store_name', v_reg.store_name, 'package_tier', v_reg.package_tier, 'status', v_reg.status, 'is_verified', true);
end; $$;
revoke all on function public.verify_registration_token(text) from public;
grant execute on function public.verify_registration_token(text) to anon, authenticated;

create or replace function public.approve_subscription_registration(p_registration_id uuid, p_decision text, p_reason text default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_action text := upper(trim(p_decision)); v_reg record;
begin
  select * into v_reg from public.subscription_registrations where id = p_registration_id limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Registrasi tidak ditemukan.'); end if;
  if v_action = 'APPROVE' then
    update public.subscription_registrations set status = 'APPROVED', approved_at = now(), updated_at = now() where id = p_registration_id;
    return jsonb_build_object('success', true, 'status', 'APPROVED');
  elsif v_action = 'REJECT' then
    update public.subscription_registrations set status = 'REJECTED', rejection_reason = p_reason, updated_at = now() where id = p_registration_id;
    return jsonb_build_object('success', true, 'status', 'REJECTED');
  else return jsonb_build_object('success', false, 'error', 'Keputusan tidak valid.'); end if;
end; $$;
revoke all on function public.approve_subscription_registration(uuid, text, text) from public;
grant execute on function public.approve_subscription_registration(uuid, text, text) to authenticated;
