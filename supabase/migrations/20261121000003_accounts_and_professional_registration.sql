-- Accounts, roles and professional registration.
-- Roles live ONLY in public.profiles. Never trust user_metadata for permissions.

-- ---------- Profiles (one per auth user) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'professional', 'admin')),
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text check (phone is null or phone ~ '^\+233[2-5][0-9]{8}$'),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users can read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
-- No insert/update/delete policies: users cannot change their own role.
-- Administrators are created by the project owner directly in the database.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_name text;
  v_phone text;
begin
  -- Signup may only ever create a customer or a professional. Never an admin.
  v_role := case when new.raw_user_meta_data ->> 'role' = 'professional'
                 then 'professional' else 'customer' end;
  v_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100);
  if char_length(v_name) < 2 then
    v_name := 'HandyCorp user';
  end if;
  v_phone := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  if v_phone is not null and v_phone !~ '^\+233[2-5][0-9]{8}$' then
    v_phone := null;
  end if;

  insert into public.profiles (id, role, full_name, phone)
  values (new.id, v_role, v_name, v_phone);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Professional registration ----------
create table public.professional_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 2 and 100),
  main_category_id uuid not null references public.service_categories (id),
  description text not null check (char_length(description) between 20 and 600),
  experience text not null check (experience in ('under-1', '1-3', '4-9', '10-plus')),
  region text not null check (char_length(region) between 2 and 60),
  city text not null check (char_length(city) between 2 and 60),
  area text not null check (char_length(area) between 2 and 60),
  work_address text check (work_address is null or char_length(work_address) <= 200),
  extra_experience text check (extra_experience is null or char_length(extra_experience) <= 600),
  -- Registration and verification are separate. Only administrators change status.
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'more_info_required', 'approved', 'rejected')),
  status_note text,
  submitted_at timestamptz not null default now()
);
create index professional_profiles_category_idx on public.professional_profiles (main_category_id);

create table public.professional_services (
  user_id uuid not null references public.professional_profiles (user_id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  primary key (user_id, service_id)
);
create index professional_services_service_idx on public.professional_services (service_id);

create table public.professional_areas (
  user_id uuid not null references public.professional_profiles (user_id) on delete cascade,
  area_id uuid not null references public.areas (id) on delete restrict,
  primary key (user_id, area_id)
);
create index professional_areas_area_idx on public.professional_areas (area_id);

create table public.professional_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.professional_profiles (user_id) on delete cascade,
  kind text not null check (kind in ('profile_photo', 'portfolio', 'certificate')),
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) <= 200),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at timestamptz not null default now(),
  check (kind not in ('profile_photo', 'portfolio') or content_type like 'image/%')
);
create index professional_documents_user_idx on public.professional_documents (user_id);

alter table public.professional_profiles enable row level security;
alter table public.professional_services enable row level security;
alter table public.professional_areas enable row level security;
alter table public.professional_documents enable row level security;

create policy "Professionals read their own registration" on public.professional_profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Professionals register once as themselves" on public.professional_profiles
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and status = 'submitted'
    and status_note is null
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'professional')
  );

create policy "Professionals read their own services" on public.professional_services
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Professionals add their own services" on public.professional_services
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Professionals read their own areas" on public.professional_areas
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Professionals add their own areas" on public.professional_areas
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Professionals read their own documents" on public.professional_documents
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Professionals add documents in their own folder" on public.professional_documents
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and storage_path like (select auth.uid())::text || '/%'
  );
-- No update/delete policies anywhere here: status and records are changed by administrators only.

-- ---------- Private uploads ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('professional-uploads', 'professional-uploads', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "Professionals upload to their own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'professional-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'professional')
  );
create policy "Professionals read their own uploads" on storage.objects
  for select to authenticated using (
    bucket_id = 'professional-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------- Submit a registration in one step (runs as the signed-in user, so RLS applies) ----------
create or replace function public.submit_professional_registration(
  p_display_name text,
  p_main_category_slug text,
  p_description text,
  p_experience text,
  p_region text,
  p_city text,
  p_area text,
  p_work_address text,
  p_extra_experience text,
  p_service_slugs text[],
  p_area_slugs text[],
  p_documents jsonb
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_category uuid;
  v_service_ids uuid[];
  v_area_ids uuid[];
  v_doc jsonb;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;

  select id into v_category from public.service_categories
    where slug = p_main_category_slug and is_active;
  if v_category is null then
    raise exception 'Unknown category' using errcode = '22023';
  end if;

  select array_agg(id) into v_service_ids from public.services
    where is_active and slug = any (p_service_slugs);
  if coalesce(cardinality(v_service_ids), 0) = 0
     or cardinality(v_service_ids) <> (select count(distinct s) from unnest(p_service_slugs) s) then
    raise exception 'Unknown or missing services' using errcode = '22023';
  end if;

  select array_agg(id) into v_area_ids from public.areas
    where is_active and slug = any (p_area_slugs);
  if coalesce(cardinality(v_area_ids), 0) = 0
     or cardinality(v_area_ids) <> (select count(distinct a) from unnest(p_area_slugs) a) then
    raise exception 'Unknown or missing areas' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_documents, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_documents, '[]'::jsonb)) > 12 then
    raise exception 'Too many documents' using errcode = '22023';
  end if;

  insert into public.professional_profiles
    (user_id, display_name, main_category_id, description, experience,
     region, city, area, work_address, extra_experience)
  values
    (v_uid, nullif(btrim(p_display_name), ''), v_category, btrim(p_description), p_experience,
     btrim(p_region), btrim(p_city), btrim(p_area),
     nullif(btrim(p_work_address), ''), nullif(btrim(p_extra_experience), ''));

  insert into public.professional_services (user_id, service_id)
    select v_uid, unnest(v_service_ids);
  insert into public.professional_areas (user_id, area_id)
    select v_uid, unnest(v_area_ids);

  for v_doc in select * from jsonb_array_elements(coalesce(p_documents, '[]'::jsonb)) loop
    insert into public.professional_documents
      (user_id, kind, storage_path, file_name, content_type, size_bytes)
    values
      (v_uid, v_doc ->> 'kind', v_doc ->> 'path', v_doc ->> 'name',
       v_doc ->> 'type', (v_doc ->> 'size')::bigint);
  end loop;
end;
$$;

revoke all on function public.submit_professional_registration(text, text, text, text, text, text, text, text, text, text[], text[], jsonb) from public, anon;
grant execute on function public.submit_professional_registration(text, text, text, text, text, text, text, text, text, text[], text[], jsonb) to authenticated;
