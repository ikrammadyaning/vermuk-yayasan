-- Fix deployed check-out RPC without dropping tables or attendance records.
-- Run this file in Supabase SQL Editor after confirming this is the correct Supabase project.
-- Enforces an 8-hour minimum from check-in and uses the existing attendance schema.

create or replace function public.record_checkout(
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
set search_path = public, pg_temp
as $$
declare
  v_check_in public.attendance%rowtype;
  v_check_out public.attendance%rowtype;
  v_min_time timestamptz;
  v_current_time timestamptz := now();
begin
  select a.* into v_check_in
  from public.attendance as a
  where a.id = p_check_in_id
    and a.employee_id = p_employee_id
    and a.type = 'check-in'
  for update;

  if not found then
    raise exception 'Data check-in tidak ditemukan untuk karyawan ini.';
  end if;

  if exists (
    select 1 from public.attendance as a
    where a.check_in_id = p_check_in_id
      and a.employee_id = p_employee_id
      and a.type = 'check-out'
  ) then
    raise exception 'Anda sudah melakukan check-out untuk absensi ini.';
  end if;

  v_min_time := v_check_in.timestamp + interval '8 hours';
  if v_current_time < v_min_time then
    raise exception 'Check-out belum diizinkan. Silakan tunggu hingga % (WIB).',
      to_char(v_min_time at time zone 'Asia/Jakarta', 'HH24:MI:SS');
  end if;

  insert into public.attendance (
    employee_id, office_location_id, latitude, longitude,
    distance_from_office, face_verified, type, check_in_id, timestamp
  ) values (
    p_employee_id, p_office_location_id, p_latitude, p_longitude,
    p_distance_from_office, coalesce(p_face_verified, false),
    'check-out', p_check_in_id, v_current_time
  )
  returning * into v_check_out;

  return query select
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

grant execute on function public.record_checkout(uuid, bigint, bigint, double precision, double precision, double precision, boolean) to anon, authenticated;
