-- Sprint 2 (v1.1.0): Auth Roles (Owner/Kasir), Strict RLS, Public Receipt RPC, Shift & Petty Cash

-- 1. Profiles table (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'kasir' check (role in ('owner', 'kasir')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := 'kasir';
begin
  if not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Shifts table
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  opening_cash numeric(12,2) not null check (opening_cash >= 0),
  expected_cash numeric(12,2),
  actual_cash numeric(12,2),
  discrepancy numeric(12,2),
  notes text,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references public.profiles(id)
);

create unique index if not exists uq_shifts_one_open_per_cashier
  on public.shifts (cashier_id)
  where status = 'OPEN';

create index if not exists idx_shifts_cashier_opened
  on public.shifts (cashier_id, opened_at desc);

-- 3. Petty cash logs table
create table if not exists public.petty_cash_logs (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete restrict,
  cashier_id uuid not null references public.profiles(id) on delete restrict,
  type text not null check (type in ('IN', 'OUT')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'OPERASIONAL',
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_petty_cash_shift_id on public.petty_cash_logs (shift_id);
create index if not exists idx_petty_cash_cashier_id on public.petty_cash_logs (cashier_id);

-- 4. Update existing tables
alter table public.products
  add column if not exists is_active boolean not null default true;

alter table public.transactions
  add column if not exists shift_id uuid references public.shifts(id) on delete restrict,
  add column if not exists cashier_id uuid references public.profiles(id) on delete restrict;

alter table public.transaction_items
  add column if not exists cost_price numeric(12,2) not null default 0;

create index if not exists idx_transactions_shift_id on public.transactions (shift_id);
create index if not exists idx_transactions_cashier_id on public.transactions (cashier_id);

-- 5. Private RLS helper functions (anti-recursion)
create schema if not exists private;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role = 'owner'
      and is_active = true
  );
$$;

create or replace function private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_active = true
  );
$$;

-- 6. Strict RLS Policies (drop v1.0.0 permissive policies)
alter table public.profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.petty_cash_logs enable row level security;

drop policy if exists "Allow all on products" on public.products;
drop policy if exists "Allow all on transactions" on public.transactions;
drop policy if exists "Allow all on transaction_items" on public.transaction_items;
drop policy if exists "Allow all on stock_logs" on public.stock_logs;

-- Profiles
drop policy if exists "Profiles select own or owner" on public.profiles;
create policy "Profiles select own or owner"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_owner());

drop policy if exists "Profiles update owner only" on public.profiles;
create policy "Profiles update owner only"
  on public.profiles for update to authenticated
  using (private.is_owner())
  with check (private.is_owner());

-- Products
drop policy if exists "Products select active users" on public.products;
create policy "Products select active users"
  on public.products for select to authenticated
  using (private.is_active_user());

drop policy if exists "Products write owner only" on public.products;
create policy "Products write owner only"
  on public.products for all to authenticated
  using (private.is_owner())
  with check (private.is_owner());

-- Shifts
drop policy if exists "Shifts select own or owner" on public.shifts;
create policy "Shifts select own or owner"
  on public.shifts for select to authenticated
  using (cashier_id = (select auth.uid()) or private.is_owner());

drop policy if exists "Shifts insert active own" on public.shifts;
create policy "Shifts insert active own"
  on public.shifts for insert to authenticated
  with check (
    private.is_active_user()
    and cashier_id = (select auth.uid())
    and status = 'OPEN'
  );

drop policy if exists "Shifts update owner only" on public.shifts;
create policy "Shifts update owner only"
  on public.shifts for update to authenticated
  using (private.is_owner())
  with check (private.is_owner());

-- Petty Cash Logs
drop policy if exists "Petty cash select own or owner" on public.petty_cash_logs;
create policy "Petty cash select own or owner"
  on public.petty_cash_logs for select to authenticated
  using (cashier_id = (select auth.uid()) or private.is_owner());

drop policy if exists "Petty cash insert active open shift" on public.petty_cash_logs;
create policy "Petty cash insert active open shift"
  on public.petty_cash_logs for insert to authenticated
  with check (
    private.is_active_user()
    and cashier_id = (select auth.uid())
    and exists (
      select 1 from public.shifts s
      where s.id = shift_id
        and s.cashier_id = (select auth.uid())
        and s.status = 'OPEN'
    )
  );

-- Transactions & Items (read own or owner; writes go via process_sale RPC)
drop policy if exists "Transactions select own or owner" on public.transactions;
create policy "Transactions select own or owner"
  on public.transactions for select to authenticated
  using (cashier_id = (select auth.uid()) or private.is_owner());

drop policy if exists "Transaction items select own or owner" on public.transaction_items;
create policy "Transaction items select own or owner"
  on public.transaction_items for select to authenticated
  using (
    exists (
      select 1 from public.transactions t
      where t.id = transaction_id
        and (t.cashier_id = (select auth.uid()) or private.is_owner())
    )
  );

-- Stock Logs (owner only)
drop policy if exists "Stock logs owner only" on public.stock_logs;
create policy "Stock logs owner only"
  on public.stock_logs for all to authenticated
  using (private.is_owner())
  with check (private.is_owner());

-- 7. Privileges: revoke anon on operational tables, grant authenticated
revoke all on table public.products from anon;
revoke all on table public.transactions from anon;
revoke all on table public.transaction_items from anon;
revoke all on table public.stock_logs from anon;
revoke all on table public.profiles from anon;
revoke all on table public.shifts from anon;
revoke all on table public.petty_cash_logs from anon;

grant select, insert, update, delete on table public.products to authenticated;
grant select on table public.transactions to authenticated;
grant select on table public.transaction_items to authenticated;
grant select, insert, update, delete on table public.stock_logs to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update on table public.shifts to authenticated;
grant select, insert on table public.petty_cash_logs to authenticated;

-- 8. Secure RPC Functions
create or replace function public.has_any_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where role = 'owner');
$$;

revoke all on function public.has_any_owner() from public;
grant execute on function public.has_any_owner() to anon, authenticated;

create or replace function public.claim_first_owner(p_full_name text default null)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'Unauthorized';
  end if;

  if exists (select 1 from public.profiles where role = 'owner') then
    raise exception 'Owner sudah terdaftar di sistem';
  end if;

  update public.profiles
  set role = 'owner',
      is_active = true,
      full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
      updated_at = now()
  where id = v_uid
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.claim_first_owner(text) from public;
grant execute on function public.claim_first_owner(text) to authenticated;

create or replace function public.get_public_receipt(p_invoice text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if p_invoice is null or length(trim(p_invoice)) < 5 then
    return null;
  end if;

  select jsonb_build_object(
    'invoice_number', t.invoice_number,
    'created_at', t.created_at,
    'payment_method', t.payment_method,
    'total_amount', t.total_amount,
    'cash_received', t.cash_received,
    'change_amount', t.change_amount,
    'cashier_name', coalesce(p.full_name, 'Kasir'),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ti.id,
        'product_name', coalesce(pr.name, ti.product_name),
        'qty', ti.qty,
        'price', ti.price,
        'subtotal', ti.subtotal
      ) order by ti.id)
      from public.transaction_items ti
      left join public.products pr on pr.id = ti.product_id
      where ti.transaction_id = t.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.transactions t
  left join public.profiles p on p.id = t.cashier_id
  where t.invoice_number = trim(p_invoice)
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.get_public_receipt(text) from public;
grant execute on function public.get_public_receipt(text) to anon, authenticated;

create or replace function public.process_sale(
  p_invoice_number text,
  p_payment_method text,
  p_cash_received numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_shift_id uuid;
  v_tx public.transactions%rowtype;
  v_total numeric := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_subtotal numeric;
  v_items_result jsonb := '[]'::jsonb;
  v_inserted_item public.transaction_items%rowtype;
begin
  if v_uid is null or not private.is_active_user() then
    raise exception 'Unauthorized or inactive user';
  end if;

  select id into v_shift_id
  from public.shifts
  where cashier_id = v_uid and status = 'OPEN'
  for update;

  if v_shift_id is null then
    raise exception 'SHIFT_REQUIRED: Buka shift terlebih dahulu sebelum melakukan transaksi';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'qty')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Jumlah item tidak valid';
    end if;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid for update;
    if not found or not v_product.is_active then
      raise exception 'Produk tidak ditemukan atau nonaktif';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stok % tidak mencukupi (sisa %)', v_product.name, v_product.stock;
    end if;
    v_total := v_total + (v_product.sell_price * v_qty);
  end loop;

  if p_payment_method = 'cash' and p_cash_received < v_total then
    raise exception 'Uang tunai kurang dari total belanja';
  end if;

  insert into public.transactions (
    invoice_number, total_amount, payment_method, cash_received, change_amount, shift_id, cashier_id
  )
  values (
    p_invoice_number, v_total, p_payment_method, p_cash_received,
    greatest(0, p_cash_received - v_total), v_shift_id, v_uid
  )
  returning * into v_tx;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'qty')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    v_subtotal := v_product.sell_price * v_qty;

    insert into public.transaction_items (
      transaction_id, product_id, product_name, qty, price, cost_price, subtotal
    )
    values (
      v_tx.id, v_product.id, v_product.name, v_qty, v_product.sell_price, v_product.buy_price, v_subtotal
    )
    returning * into v_inserted_item;

    v_items_result := v_items_result || to_jsonb(v_inserted_item);

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.stock_logs (product_id, type, qty, note)
    values (v_product.id, 'sale', -v_qty, 'Penjualan ' || p_invoice_number);
  end loop;

  return jsonb_build_object('transaction', to_jsonb(v_tx), 'items', v_items_result);
end;
$$;

revoke all on function public.process_sale(text, text, numeric, jsonb) from public, anon;
grant execute on function public.process_sale(text, text, numeric, jsonb) to authenticated;

create or replace function public.close_shift(
  p_shift_id uuid,
  p_actual_cash numeric,
  p_notes text default null
)
returns public.shifts
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_shift public.shifts;
  v_cash_sales numeric(12,2);
  v_petty_in numeric(12,2);
  v_petty_out numeric(12,2);
  v_expected numeric(12,2);
begin
  if v_uid is null or not private.is_active_user() then
    raise exception 'Unauthorized';
  end if;
  if p_actual_cash is null or p_actual_cash < 0 then
    raise exception 'Uang fisik aktual tidak valid';
  end if;

  select * into v_shift
  from public.shifts
  where id = p_shift_id
  for update;

  if not found then
    raise exception 'Shift tidak ditemukan';
  end if;
  if v_shift.status <> 'OPEN' then
    raise exception 'Shift sudah ditutup';
  end if;
  if v_shift.cashier_id <> v_uid and not private.is_owner() then
    raise exception 'Forbidden: bukan pemilik shift';
  end if;

  select coalesce(sum(total_amount), 0) into v_cash_sales
  from public.transactions
  where shift_id = p_shift_id and lower(payment_method) = 'cash';

  select
    coalesce(sum(case when type = 'IN' then amount else 0 end), 0),
    coalesce(sum(case when type = 'OUT' then amount else 0 end), 0)
  into v_petty_in, v_petty_out
  from public.petty_cash_logs
  where shift_id = p_shift_id;

  v_expected := v_shift.opening_cash + v_cash_sales + v_petty_in - v_petty_out;

  update public.shifts
  set status = 'CLOSED',
      expected_cash = v_expected,
      actual_cash = p_actual_cash,
      discrepancy = p_actual_cash - v_expected,
      notes = coalesce(nullif(trim(p_notes), ''), notes),
      closed_at = now(),
      closed_by = v_uid
  where id = p_shift_id
  returning * into v_shift;

  return v_shift;
end;
$$;

revoke all on function public.close_shift(uuid, numeric, text) from public;
grant execute on function public.close_shift(uuid, numeric, text) to authenticated;

-- 9. Version Record
insert into public.app_versions (version, phase, notes)
values (
  '1.1.0',
  'Fase 2 - Sprint 2',
  'Auth Role (Owner vs Kasir), Strict RLS, Public Digital Receipt RPC, Shift Kasir & Petty Cash'
)
on conflict (version) do nothing;
