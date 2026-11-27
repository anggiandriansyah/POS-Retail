-- Migration v2_0_3: Tenant Staff & Cashier Multi-Tenant Isolation
-- Menjamin bahwa 1 owner HANYA dapat melihat dan mengelola kasir yang didaftarkan oleh dirinya sendiri.
-- Mencegah kebocoran data user kasir toko lain dan menyembunyikan profil superadmin dari owner biasa.

-- 1. Tambah kolom owner_id dan created_by pada tabel profiles
alter table public.profiles
  add column if not exists owner_id uuid references public.profiles(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_profiles_owner_id on public.profiles(owner_id);

-- 2. Backfill owner_id untuk owner yang sudah ada
update public.profiles
set owner_id = id
where role = 'owner' and owner_id is null;

-- 3. Backfill owner_id untuk kasir lama ke owner tertua/pertama jika belum terasosiasi
update public.profiles
set owner_id = (
  select p2.id from public.profiles p2
  where p2.role = 'owner'
  order by p2.created_at asc
  limit 1
)
where role = 'kasir' and owner_id is null;

-- 4. Superadmin dipastikan tidak terikat dengan owner mana pun (global operator)
update public.profiles
set owner_id = null
where role = 'superadmin';

-- 5. Helper function private.is_superadmin()
create or replace function private.is_superadmin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- 6. Perbarui trigger handle_new_user() agar menangkap owner_id saat kasir didaftarkan
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
  v_owner_id uuid;
  v_created_by uuid;
begin
  -- Tangkap owner_id dan created_by dari raw_user_meta_data
  v_owner_id := nullif(trim(new.raw_user_meta_data->>'owner_id'), '')::uuid;
  v_created_by := nullif(trim(new.raw_user_meta_data->>'created_by'), '')::uuid;
  
  if v_owner_id is null and v_created_by is not null then
    v_owner_id := v_created_by;
  end if;

  if (new.raw_user_meta_data->>'role') = 'owner' then
    v_role := 'owner';
    v_owner_id := new.id;
  elsif (new.raw_user_meta_data->>'role') = 'superadmin' then
    v_role := 'superadmin';
    v_owner_id := null;
  elsif not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
    v_owner_id := new.id;
  end if;

  v_base_username := lower(coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  ));
  v_username := v_base_username;

  if exists (select 1 from public.profiles where lower(username) = v_username) then
    v_username := v_base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 4);
  end if;

  insert into public.profiles (id, full_name, username, role, owner_id, created_by)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    v_username,
    v_role,
    v_owner_id,
    v_created_by
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    username = excluded.username,
    owner_id = coalesce(public.profiles.owner_id, excluded.owner_id),
    created_by = coalesce(public.profiles.created_by, excluded.created_by),
    updated_at = now();

  return new;
end;
$$;

-- 7. Perketat Row Level Security (RLS) pada tabel profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles select own or owner" on public.profiles;
drop policy if exists "Profiles select tenant isolated" on public.profiles;

create policy "Profiles select tenant isolated"
  on public.profiles for select to authenticated
  using (
    -- User selalu dapat melihat profil dirinya sendiri
    id = auth.uid()
    -- Superadmin dapat melihat seluruh profil sistem
    or private.is_superadmin()
    -- Owner HANYA dapat melihat kasir toko miliknya sendiri (owner_id = auth.uid())
    -- dan TIDAK BISA melihat profil owner lain maupun superadmin!
    or (
      private.is_owner() 
      and owner_id = auth.uid() 
      and role != 'superadmin'
    )
  );

drop policy if exists "Profiles update owner only" on public.profiles;
drop policy if exists "Profiles update tenant isolated" on public.profiles;

create policy "Profiles update tenant isolated"
  on public.profiles for update to authenticated
  using (
    private.is_superadmin()
    or (
      private.is_owner() 
      and owner_id = auth.uid() 
      and id != auth.uid() 
      and role != 'superadmin'
    )
  )
  with check (
    private.is_superadmin()
    or (
      private.is_owner() 
      and owner_id = auth.uid() 
      and id != auth.uid() 
      and role != 'superadmin'
    )
  );
