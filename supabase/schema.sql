-- Custom staff database WITHOUT Supabase Auth.
-- Run this in Supabase SQL Editor if you want accounts/attendance stored remotely.

create extension if not exists "pgcrypto";

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  employee_code text not null unique,
  username text not null unique,
  password_hash text not null,
  face_enrolled boolean not null default false,
  face_descriptor jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.office_locations (
  id bigint generated always as identity primary key,
  name text not null,
  google_maps_url text not null,
  latitude double precision,
  longitude double precision,
  radius integer not null default 100,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id bigint generated always as identity primary key,
  employee_id uuid not null references public.employees(id) on delete restrict,
  office_location_id bigint not null,
  latitude double precision not null,
  longitude double precision not null,
  distance_from_office double precision not null,
  face_verified boolean not null default false,
  type text not null default 'check-in' check (type in ('check-in', 'check-out')),
  check_in_id bigint references public.attendance(id) on delete set null,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Fungsi untuk mencatat check-out dengan validasi 9 jam
create or replace function record_checkout(
  p_employee_id uuid,
  p_check_in_id bigint,
  p_office_location_id bigint,
  p_latitude double precision,
  p_longitude double precision,
  p_distance_from_office double precision,
  p_face_verified boolean default false
)
returns table (
  id bigint,
  employee_id uuid,
  office_location_id bigint,
  latitude double precision,
  longitude double precision,
  distance_from_office double precision,
  face_verified boolean,
  type text,
  check_in_id bigint,
  timestamp timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_check_in public.attendance%rowtype;
  v_check_out public.attendance%rowtype;
  v_min_time timestamptz;
begin
  -- Cari data check-in
  select * into v_check_in
  from public.attendance
  where id = p_check_in_id
    and employee_id = p_employee_id
    and type = 'check-in';

  if not found then
    raise exception 'Data check-in tidak ditemukan atau不属于 karyawan ini.';
  end if;

  -- Cek apakah sudah ada check-out untuk check-in ini
  if exists (
    select 1 from public.attendance
    where check_in_id = p_check_in_id
      and employee_id = p_employee_id
      and type = 'check-out'
  ) then
    raise exception 'Anda sudah melakukan check-out untuk absensi ini.';
  end if;

  -- Hitung waktu minimum check-out (check-in + 9 jam) dalam zona Asia/Jakarta
  v_min_time := v_check_in.timestamp AT TIME ZONE 'Asia/Jakarta' + interval '9 hours';
  v_current_time timestamptz := now() AT TIME ZONE 'Asia/Jakarta'; -- Waktu sekarang di zona WIB

  -- Validasi: waktu sekarang harus >= check-in + 9 jam
  if v_current_time < v_min_time then
    raise exception 'Check-out belum diizinkan. Silakan tunggu hingga %s (WIB).',
      to_char(v_min_time, 'HH24:MI:SS');
  end if;

  -- Catat check-out
  insert into public.attendance (
    employee_id,
    office_location_id,
    latitude,
    longitude,
    distance_from_office,
    face_verified,
    type,
    check_in_id,
    timestamp
  ) values (
    p_employee_id,
    p_office_location_id,
    p_latitude,
    p_longitude,
    p_distance_from_office,
    p_face_verified,
    'check-out',
    p_check_in_id,
    now()
  )
  returning * into v_check_out;

  return query
  select
    v_check_out.id,
    v_check_out.employee_id,
    v_check_out.office_location_id,
    v_check_out.latitude,
    v_check_out.longitude,
    v_check_out.distance_from_office,
    v_check_out.face_verified,
    v_check_out.type,
    v_check_out.check_in_id,
    v_check_out.timestamp,
    v_check_out.created_at;
end;
$$;

insert into public.office_locations (name, google_maps_url, latitude, longitude, radius, status)
values
  ('Pusat', 'https://maps.app.goo.gl/DFdr8X54oSdELrBa8', -6.296565590898558, 106.97356988878227, 100, 'active'),
  ('Cabang 1', 'https://maps.app.goo.gl/z28WrqsyiQtKhQDH8', -6.3002545853050504, 106.96961107216039, 100, 'active'),
  ('Cabang 2', 'https://maps.app.goo.gl/jZ7hoAx5iSA4ZLWD9?g_st=awb', -6.299806695486294, 106.96989002208893, 100, 'active'),
  ('Cabang 3', 'https://maps.app.goo.gl/CcWqy7C9WM1ne87r5', -6.968049250794925, 106.78555693686727, 100, 'active')
on conflict (name) do nothing;

create index if not exists idx_attendance_employee_id on public.attendance(employee_id);
create index if not exists idx_attendance_timestamp on public.attendance(timestamp desc);

-- Development RLS: the anon client is allowed to perform the custom-account flow.
-- This is NOT a production-grade auth system. For production, move password verification,
-- session issuance, face matching and attendance validation into a trusted backend/Edge Function.
alter table public.employees enable row level security;
alter table public.office_locations enable row level security;
alter table public.attendance enable row level security;

drop policy if exists "employees_anon_select" on public.employees;
create policy "employees_anon_select" on public.employees for select to anon using (true);
drop policy if exists "employees_anon_insert" on public.employees;
create policy "employees_anon_insert" on public.employees for insert to anon with check (true);
drop policy if exists "employees_anon_update" on public.employees;
create policy "employees_anon_update" on public.employees for update to anon using (true) with check (true);

drop policy if exists "office_locations_anon_select" on public.office_locations;
create policy "office_locations_anon_select" on public.office_locations for select to anon using (true);

drop policy if exists "attendance_anon_insert" on public.attendance;
create policy "attendance_anon_insert" on public.attendance for insert to anon with check (true);
drop policy if exists "attendance_anon_select" on public.attendance;
create policy "attendance_anon_select" on public.attendance for select to anon using (true);

-- If you already have the old schema, run these migrations manually if needed:
alter table public.employees add column if not exists face_descriptor jsonb;
-- alter table public.employees add column if not exists employee_code text;
-- alter table public.employees add column if not exists username text;
-- alter table public.employees add column if not exists password_hash text;
-- alter table public.employees add column if not exists face_enrolled boolean not null default false;

-- Admin demo account is handled in the frontend authService and does not use Supabase Auth.
-- Username: Admin 1
-- Password: karisma
-- The admin is restricted by the app to the /history page only.
