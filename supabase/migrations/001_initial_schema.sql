-- ============================================================
-- Rabt Al-Baneen — Initial Schema Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────
-- Extends auth.users with app-specific fields
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  role        text not null default 'user' check (role in ('admin', 'user')),
  is_active   boolean not null default true,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on new auth user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    true
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ─── BOYS ────────────────────────────────────────────────────
create table if not exists public.boys (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  profile_image_url text,
  address           text,
  date_of_birth     date,
  phone_number      text,
  notes             text,
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists boys_full_name_idx on public.boys using gin(to_tsvector('english', full_name));
create index if not exists boys_created_at_idx on public.boys(created_at desc);

create trigger boys_updated_at
  before update on public.boys
  for each row execute procedure public.handle_updated_at();

-- ─── CHECK-INS ───────────────────────────────────────────────
create table if not exists public.check_ins (
  id          uuid primary key default gen_random_uuid(),
  boy_id      uuid not null references public.boys(id) on delete cascade,
  created_by  uuid references public.profiles(id) on delete set null,
  visit_date  timestamptz not null default now(),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists check_ins_boy_id_idx      on public.check_ins(boy_id);
create index if not exists check_ins_created_by_idx  on public.check_ins(created_by);
create index if not exists check_ins_visit_date_idx  on public.check_ins(visit_date desc);

create trigger check_ins_updated_at
  before update on public.check_ins
  for each row execute procedure public.handle_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

alter table public.profiles   enable row level security;
alter table public.boys       enable row level security;
alter table public.check_ins  enable row level security;

-- Helper: is current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

-- Helper: is current user active?
create or replace function public.is_active_user()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

-- PROFILES policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "Admins can insert profiles"
  on public.profiles for insert
  with check (public.is_admin());

create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  using (public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- BOYS policies
create policy "Active users can view boys"
  on public.boys for select
  using (public.is_active_user());

create policy "Admins can insert boys"
  on public.boys for insert
  with check (public.is_admin());

create policy "Admins can update boys"
  on public.boys for update
  using (public.is_admin());

create policy "Admins can delete boys"
  on public.boys for delete
  using (public.is_admin());

-- CHECK-INS policies
create policy "Active users can view check-ins"
  on public.check_ins for select
  using (public.is_active_user());

create policy "Active users can insert check-ins"
  on public.check_ins for insert
  with check (public.is_active_user());

create policy "Admins can update check-ins"
  on public.check_ins for update
  using (public.is_admin());

create policy "Admins can delete check-ins"
  on public.check_ins for delete
  using (public.is_admin());

-- ─── STORAGE BUCKET ──────────────────────────────────────────
-- Run in Supabase Dashboard > Storage > New bucket
-- Name: boy-images, Public: false
-- OR run this SQL:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'boy-images',
  'boy-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Storage policies
create policy "Active users can upload boy images"
  on storage.objects for insert
  with check (
    bucket_id = 'boy-images' and public.is_active_user()
  );

create policy "Anyone can view boy images"
  on storage.objects for select
  using (bucket_id = 'boy-images');

create policy "Admins can delete boy images"
  on storage.objects for delete
  using (bucket_id = 'boy-images' and public.is_admin());

-- ─── SEED: Ensure existing users (including admin) have profiles ────────
insert into public.profiles (id, full_name, email, role, is_active)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', 'System Admin'), 
  coalesce(email, 'admin@rabt.app'), 
  'admin', 
  true
from auth.users
on conflict (id) do update set role = 'admin', is_active = true;
