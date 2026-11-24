-- Sprint 3 (v1.3.0): Store Settings, Item & Receipt Discounts, Optional Tax/PPN,
-- Hardened process_sale & get_public_receipt RPCs, and Backward-Compatible Dual Roles ('owner'/'admin', 'kasir'/'user')

-- ============================================================================
-- 1. Role Backward Compatibility: Support ('owner', 'kasir', 'admin', 'user')
-- ============================================================================

do $$
declare
  v_conname text;
begin
  for v_conname in
    select conname
    from pg_catalog.pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_catalog.pg_get_constraintdef(oid) ~* '\yrole\y'
  loop
    execute pg_catalog.format('alter table public.profiles drop constraint if exists %I', v_conname);
  end loop;

  alter table public.profiles drop constraint if exists profiles_role_check;
  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('owner', 'kasir', 'admin', 'user'));
end $$;

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
      and role in ('owner', 'admin')
      and is_active = true
  );
$$;

revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

create or replace function public.has_any_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where role in ('owner', 'admin')
  );
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

  if exists (select 1 from public.profiles where role in ('owner', 'admin')) then
    raise exception 'Owner sudah terdaftar di sistem';
  end if;

  update public.profiles
  set role = 'owner',
      is_active = true,
      full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
      updated_at = pg_catalog.now()
  where id = v_uid
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke all on function public.claim_first_owner(text) from public;
grant execute on function public.claim_first_owner(text) to authenticated;

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
  if not exists (select 1 from public.profiles where role in ('owner', 'admin')) then
    v_role := 'owner';
  end if;

  v_base_username := pg_catalog.lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    pg_catalog.split_part(new.email, '@', 1)
  ));
  v_username := v_base_username;

  if exists (select 1 from public.profiles where pg_catalog.lower(username) = v_username) then
    v_username := v_base_username || '_' || pg_catalog.substr(pg_catalog.replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, full_name, username, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), pg_catalog.split_part(new.email, '@', 1)),
    v_username,
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ============================================================================
-- 2. Store Settings (singleton id = 1) + Strict RLS + Realtime (US-3.1)
-- ============================================================================

create table if not exists public.store_settings (
  id integer primary key default 1
    constraint chk_store_settings_singleton check (id = 1),
  store_name text not null default 'Toko Retail Anda'
    constraint chk_store_settings_store_name check (pg_catalog.length(trim(store_name)) > 0),
  address text not null default 'Jl. Contoh No. 123, Indonesia',
  phone text not null default '0812-3456-7890',
  footer_note text not null default 'Terima kasih telah berbelanja! Barang yang sudah dibeli tidak dapat ditukar.',
  tax_enabled boolean not null default false,
  tax_rate numeric(5,2) not null default 0
    constraint chk_store_settings_tax_rate check (tax_rate >= 0 and tax_rate <= 100),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_settings_updated_by
  on public.store_settings (updated_by);

create or replace function public.set_store_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists trg_store_settings_updated_at on public.store_settings;
create trigger trg_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_store_settings_updated_at();

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.store_settings enable row level security;

drop policy if exists "Store settings select active users" on public.store_settings;
create policy "Store settings select active users"
  on public.store_settings for select to authenticated
  using ((select private.is_active_user()));

drop policy if exists "Store settings insert owner only" on public.store_settings;
create policy "Store settings insert owner only"
  on public.store_settings for insert to authenticated
  with check ((select private.is_owner()));

drop policy if exists "Store settings update owner only" on public.store_settings;
create policy "Store settings update owner only"
  on public.store_settings for update to authenticated
  using ((select private.is_owner()))
  with check ((select private.is_owner()));

revoke all on table public.store_settings from public, anon;
grant select, insert, update on table public.store_settings to authenticated;

do $$
begin
  if exists (
    select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1 from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'store_settings'
  ) then
    alter publication supabase_realtime add table public.store_settings;
  end if;
end $$;

-- ============================================================================
-- 3. Extend Transactions & Transaction Items for Discounts & Optional Tax (US-3.2)
-- ============================================================================

alter table public.transactions
  add column if not exists subtotal_amount numeric(12,2) not null default 0,
  add column if not exists discount_type text not null default 'nominal',
  add column if not exists discount_value numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0,
  add column if not exists tax_rate numeric(5,2) not null default 0,
  add column if not exists tax_amount numeric(12,2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_subtotal_amount'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_subtotal_amount
      check (subtotal_amount >= 0 and subtotal_amount < 'Infinity'::numeric);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_discount_type'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_discount_type
      check (discount_type in ('nominal', 'percent'));
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_discount_value'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_discount_value
      check (discount_value >= 0 and discount_value < 'Infinity'::numeric);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_discount_percent_max'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_discount_percent_max
      check (discount_type <> 'percent' or discount_value <= 100);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_discount_amount'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_discount_amount
      check (discount_amount >= 0 and discount_amount < 'Infinity'::numeric);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_tax_rate'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_tax_rate
      check (tax_rate >= 0 and tax_rate <= 100);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_tax_amount'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_tax_amount
      check (tax_amount >= 0 and tax_amount < 'Infinity'::numeric);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transactions_total_amount_non_negative'
      and conrelid = 'public.transactions'::regclass
  ) then
    alter table public.transactions
      add constraint chk_transactions_total_amount_non_negative
      check (total_amount >= 0 and total_amount < 'Infinity'::numeric);
  end if;
end $$;

-- Idempotent legacy backfill for historical transactions prior to Sprint 3
update public.transactions
set subtotal_amount = total_amount
where subtotal_amount = 0
  and discount_amount = 0
  and tax_amount = 0
  and total_amount > 0;

alter table public.transaction_items
  add column if not exists discount_type text not null default 'nominal',
  add column if not exists discount_value numeric(12,2) not null default 0,
  add column if not exists discount_amount numeric(12,2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transaction_items_discount_type'
      and conrelid = 'public.transaction_items'::regclass
  ) then
    alter table public.transaction_items
      add constraint chk_transaction_items_discount_type
      check (discount_type in ('nominal', 'percent'));
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transaction_items_discount_value'
      and conrelid = 'public.transaction_items'::regclass
  ) then
    alter table public.transaction_items
      add constraint chk_transaction_items_discount_value
      check (discount_value >= 0 and discount_value < 'Infinity'::numeric);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transaction_items_discount_percent_max'
      and conrelid = 'public.transaction_items'::regclass
  ) then
    alter table public.transaction_items
      add constraint chk_transaction_items_discount_percent_max
      check (discount_type <> 'percent' or discount_value <= 100);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transaction_items_discount_amount'
      and conrelid = 'public.transaction_items'::regclass
  ) then
    alter table public.transaction_items
      add constraint chk_transaction_items_discount_amount
      check (discount_amount >= 0 and discount_amount < 'Infinity'::numeric);
  end if;

  if not exists (
    select 1 from pg_catalog.pg_constraint
    where conname = 'chk_transaction_items_subtotal_non_negative'
      and conrelid = 'public.transaction_items'::regclass
  ) then
    alter table public.transaction_items
      add constraint chk_transaction_items_subtotal_non_negative
      check (subtotal >= 0 and subtotal < 'Infinity'::numeric);
  end if;
end $$;

-- ============================================================================
-- 4. Atomic process_sale RPC (drop 4-arg first, replace with 7-arg + defaults)
-- ============================================================================

drop function if exists public.process_sale(text, text, numeric, jsonb);

create or replace function public.process_sale(
  p_invoice_number text,
  p_payment_method text,
  p_cash_received numeric,
  p_items jsonb,
  p_discount_type text default 'nominal',
  p_discount_value numeric default 0,
  p_apply_tax boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_invoice text := trim(coalesce(p_invoice_number, ''));
  v_payment_method text := pg_catalog.lower(trim(coalesce(p_payment_method, '')));
  v_order_disc_type text := pg_catalog.lower(trim(coalesce(p_discount_type, 'nominal')));
  v_order_disc_val numeric := coalesce(p_discount_value, 0);

  v_shift_id uuid;
  v_tx public.transactions%rowtype;
  v_product public.products%rowtype;
  v_inserted_item public.transaction_items%rowtype;

  v_item jsonb;
  v_product_id_text text;
  v_product_id uuid;
  v_qty_num numeric;
  v_qty integer;
  v_item_disc_type text;
  v_item_disc_val numeric;
  v_product_req record;

  v_line_gross numeric(18,2);
  v_item_disc_amt numeric(18,2);
  v_line_net numeric(18,2);

  v_subtotal_amount numeric(18,2) := 0;
  v_order_disc_amt numeric(18,2) := 0;
  v_after_discount numeric(18,2) := 0;

  v_store_tax_enabled boolean := false;
  v_store_tax_rate numeric(5,2) := 0;
  v_effective_tax_enabled boolean := false;
  v_effective_tax_rate numeric(5,2) := 0;
  v_tax_amount numeric(18,2) := 0;
  v_total numeric(18,2) := 0;

  v_cash_received numeric(12,2) := 0;
  v_change_amount numeric(12,2) := 0;
  v_items_result jsonb := '[]'::jsonb;
begin
  -- 1. Auth & active user check
  if v_uid is null or not private.is_active_user() then
    raise exception 'Unauthorized or inactive user';
  end if;

  -- 2. Scalar parameter validation (before acquiring row locks)
  if v_invoice = '' or pg_catalog.length(v_invoice) > 100 then
    raise exception 'Nomor invoice tidak valid';
  end if;

  if v_payment_method not in ('cash', 'qris', 'transfer') then
    raise exception 'Metode pembayaran tidak valid';
  end if;

  if v_order_disc_type not in ('nominal', 'percent') then
    raise exception 'Tipe diskon nota tidak valid';
  end if;

  if not (v_order_disc_val > '-Infinity'::numeric and v_order_disc_val < 'Infinity'::numeric)
     or v_order_disc_val < 0
     or v_order_disc_val > 9999999999.99 then
    raise exception 'Nilai diskon nota tidak valid';
  end if;

  if v_order_disc_type = 'percent' and v_order_disc_val > 100 then
    raise exception 'Persentase diskon nota harus antara 0 dan 100';
  end if;

  v_order_disc_val := pg_catalog.round(v_order_disc_val, 2);

  if p_cash_received is not null and (
    not (p_cash_received > '-Infinity'::numeric and p_cash_received < 'Infinity'::numeric)
    or p_cash_received < 0
    or p_cash_received > 9999999999.99
  ) then
    raise exception 'Nominal pembayaran tidak valid';
  end if;

  if v_payment_method = 'cash' and p_cash_received is null then
    raise exception 'Nominal uang tunai wajib diisi';
  end if;

  if p_items is null
     or pg_catalog.jsonb_typeof(p_items) <> 'array'
     or pg_catalog.jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang belanja kosong';
  end if;

  if pg_catalog.jsonb_array_length(p_items) > 500 then
    raise exception 'Jumlah baris item melebihi batas';
  end if;

  -- 3. Pre-validate every item payload in p_items before locking
  for v_item in select * from pg_catalog.jsonb_array_elements(p_items)
  loop
    if v_item is null or pg_catalog.jsonb_typeof(v_item) <> 'object' then
      raise exception 'Format item keranjang tidak valid';
    end if;

    v_product_id_text := trim(coalesce(v_item->>'product_id', ''));
    if not (v_item ? 'product_id')
       or pg_catalog.jsonb_typeof(v_item->'product_id') <> 'string'
       or v_product_id_text !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
      raise exception 'ID produk tidak valid';
    end if;

    if not (v_item ? 'qty') or pg_catalog.jsonb_typeof(v_item->'qty') <> 'number' then
      raise exception 'Jumlah item tidak valid';
    end if;

    v_qty_num := (v_item->>'qty')::numeric;
    if v_qty_num is null
       or not (v_qty_num > '-Infinity'::numeric and v_qty_num < 'Infinity'::numeric)
       or v_qty_num <> pg_catalog.trunc(v_qty_num)
       or v_qty_num <= 0
       or v_qty_num > 1000000 then
      raise exception 'Jumlah item harus bilangan bulat lebih dari 0';
    end if;

    if (v_item ? 'discount_type') and (v_item->'discount_type' <> 'null'::jsonb) then
      if pg_catalog.jsonb_typeof(v_item->'discount_type') <> 'string' then
        raise exception 'Tipe diskon item tidak valid';
      end if;
      v_item_disc_type := pg_catalog.lower(trim(v_item->>'discount_type'));
    else
      v_item_disc_type := 'nominal';
    end if;

    if v_item_disc_type not in ('nominal', 'percent') then
      raise exception 'Tipe diskon item tidak valid';
    end if;

    if (v_item ? 'discount_value') and (v_item->'discount_value' <> 'null'::jsonb) then
      if pg_catalog.jsonb_typeof(v_item->'discount_value') <> 'number' then
        raise exception 'Nilai diskon item tidak valid';
      end if;
      v_item_disc_val := (v_item->>'discount_value')::numeric;
    else
      v_item_disc_val := 0;
    end if;

    if v_item_disc_val is null
       or not (v_item_disc_val > '-Infinity'::numeric and v_item_disc_val < 'Infinity'::numeric)
       or v_item_disc_val < 0
       or v_item_disc_val > 9999999999.99 then
      raise exception 'Nilai diskon item tidak valid';
    end if;

    if v_item_disc_type = 'percent' and v_item_disc_val > 100 then
      raise exception 'Persentase diskon item harus antara 0 dan 100';
    end if;

    v_item_disc_val := pg_catalog.round(v_item_disc_val, 2);
  end loop;

  -- 4. Lock cashier's active OPEN shift
  select id into v_shift_id
  from public.shifts
  where cashier_id = v_uid and status = 'OPEN'
  for update;

  if v_shift_id is null then
    raise exception 'SHIFT_REQUIRED: Buka shift terlebih dahulu sebelum melakukan transaksi';
  end if;

  -- 5. Lock distinct products in deterministic UUID order & check cumulative stock
  for v_product_req in
    select
      (elem->>'product_id')::uuid as product_id,
      sum((elem->>'qty')::numeric) as total_qty
    from pg_catalog.jsonb_array_elements(p_items) as elem
    group by (elem->>'product_id')::uuid
    order by (elem->>'product_id')::uuid
  loop
    select * into v_product
    from public.products
    where id = v_product_req.product_id
    for update;

    if not found or not v_product.is_active then
      raise exception 'Produk tidak ditemukan atau nonaktif';
    end if;

    if v_product.stock < v_product_req.total_qty then
      raise exception 'Stok % tidak mencukupi (sisa %)', v_product.name, v_product.stock;
    end if;
  end loop;

  -- 6. Compute subtotal across all line items using authoritative DB prices
  for v_item in select * from pg_catalog.jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := ((v_item->>'qty')::numeric)::integer;
    v_item_disc_type := case
      when (v_item ? 'discount_type') and (v_item->'discount_type' <> 'null'::jsonb)
        then pg_catalog.lower(trim(v_item->>'discount_type'))
      else 'nominal'
    end;
    v_item_disc_val := case
      when (v_item ? 'discount_value') and (v_item->'discount_value' <> 'null'::jsonb)
        then pg_catalog.round((v_item->>'discount_value')::numeric, 2)
      else 0
    end;

    select * into v_product from public.products where id = v_product_id;

    v_line_gross := pg_catalog.round(v_product.sell_price * v_qty, 0);
    if v_line_gross > 9999999999.99 then
      raise exception 'Total transaksi melebihi batas maksimum';
    end if;

    if v_item_disc_type = 'percent' then
      v_item_disc_amt := greatest(0, pg_catalog.round(v_line_gross * v_item_disc_val / 100.0, 0));
    else
      v_item_disc_amt := greatest(0, least(v_line_gross, pg_catalog.round(v_item_disc_val, 0)));
    end if;
    v_line_net := greatest(0, v_line_gross - v_item_disc_amt);
    v_subtotal_amount := v_subtotal_amount + v_line_net;
    if v_subtotal_amount > 9999999999.99 then
      raise exception 'Total transaksi melebihi batas maksimum';
    end if;
  end loop;

  -- 7. Order-level discount
  if v_order_disc_type = 'percent' then
    v_order_disc_amt := greatest(0, pg_catalog.round(v_subtotal_amount * v_order_disc_val / 100.0, 0));
  else
    v_order_disc_amt := greatest(0, least(v_subtotal_amount, pg_catalog.round(v_order_disc_val, 0)));
  end if;
  v_after_discount := greatest(0, v_subtotal_amount - v_order_disc_amt);

  -- 8. Store-settings tax lookup with safe fallback
  select tax_enabled, tax_rate
  into v_store_tax_enabled, v_store_tax_rate
  from public.store_settings
  where id = 1;

  if not found then
    v_store_tax_enabled := false;
    v_store_tax_rate := 0;
  else
    v_store_tax_enabled := coalesce(v_store_tax_enabled, false);
    v_store_tax_rate := coalesce(v_store_tax_rate, 0);
  end if;

  v_effective_tax_enabled := v_store_tax_enabled and coalesce(p_apply_tax, true);
  v_effective_tax_rate := case when v_effective_tax_enabled then v_store_tax_rate else 0 end;
  v_tax_amount := case
    when v_effective_tax_enabled and v_effective_tax_rate > 0
      then pg_catalog.round(v_after_discount * v_effective_tax_rate / 100.0, 0)
    else 0
  end;

  v_total := greatest(0, v_after_discount + v_tax_amount);
  if v_total > 9999999999.99 then
    raise exception 'Total transaksi melebihi batas maksimum';
  end if;

  -- 9. Payment validation & non-cash normalization
  if v_payment_method = 'cash' then
    if p_cash_received < v_total then
      raise exception 'Uang tunai kurang dari total belanja';
    end if;
    v_cash_received := pg_catalog.round(p_cash_received, 2);
    v_change_amount := greatest(0, v_cash_received - v_total);
  else
    v_cash_received := v_total;
    v_change_amount := 0;
  end if;

  -- 10. Insert transaction header
  insert into public.transactions (
    invoice_number,
    subtotal_amount,
    discount_type,
    discount_value,
    discount_amount,
    tax_rate,
    tax_amount,
    total_amount,
    payment_method,
    cash_received,
    change_amount,
    shift_id,
    cashier_id
  )
  values (
    v_invoice,
    v_subtotal_amount,
    v_order_disc_type,
    pg_catalog.round(v_order_disc_val, 2),
    v_order_disc_amt,
    v_effective_tax_rate,
    v_tax_amount,
    v_total,
    v_payment_method,
    v_cash_received,
    v_change_amount,
    v_shift_id,
    v_uid
  )
  returning * into v_tx;

  -- 11. Insert transaction items, decrement stock, insert stock logs
  for v_item in select * from pg_catalog.jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := ((v_item->>'qty')::numeric)::integer;
    v_item_disc_type := case
      when (v_item ? 'discount_type') and (v_item->'discount_type' <> 'null'::jsonb)
        then pg_catalog.lower(trim(v_item->>'discount_type'))
      else 'nominal'
    end;
    v_item_disc_val := case
      when (v_item ? 'discount_value') and (v_item->'discount_value' <> 'null'::jsonb)
        then pg_catalog.round((v_item->>'discount_value')::numeric, 2)
      else 0
    end;

    select * into v_product from public.products where id = v_product_id;

    v_line_gross := pg_catalog.round(v_product.sell_price * v_qty, 0);
    if v_item_disc_type = 'percent' then
      v_item_disc_amt := greatest(0, pg_catalog.round(v_line_gross * v_item_disc_val / 100.0, 0));
    else
      v_item_disc_amt := greatest(0, least(v_line_gross, pg_catalog.round(v_item_disc_val, 0)));
    end if;
    v_line_net := greatest(0, v_line_gross - v_item_disc_amt);

    insert into public.transaction_items (
      transaction_id,
      product_id,
      product_name,
      qty,
      price,
      cost_price,
      discount_type,
      discount_value,
      discount_amount,
      subtotal
    )
    values (
      v_tx.id,
      v_product.id,
      v_product.name,
      v_qty,
      v_product.sell_price,
      v_product.buy_price,
      v_item_disc_type,
      pg_catalog.round(v_item_disc_val, 2),
      v_item_disc_amt,
      v_line_net
    )
    returning * into v_inserted_item;

    v_items_result := v_items_result || pg_catalog.to_jsonb(v_inserted_item);

    update public.products
    set stock = stock - v_qty
    where id = v_product.id
      and stock >= v_qty;

    if not found then
      raise exception 'Stok % tidak mencukupi', v_product.name;
    end if;

    insert into public.stock_logs (product_id, type, qty, note)
    values (v_product.id, 'sale', -v_qty, 'Penjualan ' || v_invoice);
  end loop;

  return pg_catalog.jsonb_build_object(
    'transaction', pg_catalog.to_jsonb(v_tx),
    'items', v_items_result
  );
end;
$$;

revoke all on function public.process_sale(text, text, numeric, jsonb, text, numeric, boolean) from public, anon;
grant execute on function public.process_sale(text, text, numeric, jsonb, text, numeric, boolean) to authenticated;

-- ============================================================================
-- 5. Public Digital Receipt RPC with Store Settings & Discount/Tax Breakdown
-- ============================================================================

create or replace function public.get_public_receipt(p_invoice text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice text := trim(coalesce(p_invoice, ''));
  v_result jsonb;
begin
  if v_invoice = '' or pg_catalog.length(v_invoice) < 5 then
    return null;
  end if;

  select pg_catalog.jsonb_build_object(
    'id', t.id,
    'invoice_number', t.invoice_number,
    'created_at', t.created_at,
    'payment_method', t.payment_method,
    'subtotal_amount', t.subtotal_amount,
    'discount_type', t.discount_type,
    'discount_value', t.discount_value,
    'discount_amount', t.discount_amount,
    'tax_rate', t.tax_rate,
    'tax_amount', t.tax_amount,
    'total_amount', t.total_amount,
    'cash_received', t.cash_received,
    'change_amount', t.change_amount,
    'cashier_name', coalesce(p.full_name, 'Kasir'),
    'items', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'id', ti.id,
        'product_name', coalesce(pr.name, ti.product_name),
        'price', ti.price,
        'qty', ti.qty,
        'discount_type', ti.discount_type,
        'discount_value', ti.discount_value,
        'discount_amount', ti.discount_amount,
        'subtotal', ti.subtotal
      ) order by ti.id)
      from public.transaction_items ti
      left join public.products pr on pr.id = ti.product_id
      where ti.transaction_id = t.id
    ), '[]'::jsonb),
    'store_settings', pg_catalog.jsonb_build_object(
      'store_name', coalesce(nullif(trim(s.store_name), ''), 'Toko Retail Anda'),
      'address', coalesce(s.address, 'Jl. Contoh No. 123, Indonesia'),
      'phone', coalesce(s.phone, '0812-3456-7890'),
      'footer_note', coalesce(s.footer_note, 'Terima kasih telah berbelanja! Barang yang sudah dibeli tidak dapat ditukar.'),
      'tax_enabled', coalesce(s.tax_enabled, false),
      'tax_rate', coalesce(s.tax_rate, 0)
    )
  )
  into v_result
  from public.transactions t
  left join public.profiles p on p.id = t.cashier_id
  left join public.store_settings s on s.id = 1
  where t.invoice_number = v_invoice
  limit 1;

  return v_result;
end;
$$;

revoke all on function public.get_public_receipt(text) from public;
grant execute on function public.get_public_receipt(text) to anon, authenticated;

-- ============================================================================
-- 6. Version Record (1.3.0)
-- ============================================================================

insert into public.app_versions (version, phase, notes)
values (
  '1.3.0',
  'Fase 2 - Sprint 3',
  'Dynamic Store Settings (store_settings), Item & Receipt Discounts (Rp/%), Optional Tax/PPN, Sales & Stock CSV Export, Tech Debt & Shared Core, Dual-Role Backward Compatibility'
)
on conflict (version) do nothing;
