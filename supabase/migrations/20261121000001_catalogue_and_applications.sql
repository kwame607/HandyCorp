-- HandyCorp: service catalogue and professional applications.

-- ---------- Catalogue (public, read-only) ----------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null,
  description text not null,
  photo_path text,
  photo_alt text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories (id) on delete restrict,
  slug text not null unique,
  name text not null,
  keywords text[] not null default '{}',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index services_category_id_idx on public.services (category_id);

create table public.popular_services (
  service_id uuid primary key references public.services (id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  city text not null default 'Kumasi',
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------- Professional applications (private) ----------
create table public.professional_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  phone text not null unique check (phone ~ '^\+233[2-5][0-9]{8}$'),
  email text check (email is null or (char_length(email) <= 254 and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$')),
  experience text not null check (experience in ('under-1', '1-3', '4-9', '10-plus')),
  work_mode text not null check (work_mode in ('workshop', 'travel', 'both')),
  about text check (about is null or char_length(about) <= 600),
  status text not null default 'new' check (status in ('new', 'contacted', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.application_services (
  application_id uuid not null references public.professional_applications (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  primary key (application_id, service_id)
);
create index application_services_service_id_idx on public.application_services (service_id);

create table public.application_areas (
  application_id uuid not null references public.professional_applications (id) on delete cascade,
  area_id uuid not null references public.areas (id) on delete restrict,
  primary key (application_id, area_id)
);
create index application_areas_area_id_idx on public.application_areas (area_id);

-- ---------- Row-level security ----------
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.popular_services enable row level security;
alter table public.areas enable row level security;
alter table public.professional_applications enable row level security;
alter table public.application_services enable row level security;
alter table public.application_areas enable row level security;

create policy "Anyone can read active categories" on public.service_categories
  for select to anon, authenticated using (is_active);
create policy "Anyone can read active services" on public.services
  for select to anon, authenticated using (is_active);
create policy "Anyone can read popular services" on public.popular_services
  for select to anon, authenticated using (true);
create policy "Anyone can read active areas" on public.areas
  for select to anon, authenticated using (is_active);
-- Application tables deliberately have no policies: no public read or write.

-- ---------- The only way in: submit an application ----------
create or replace function public.submit_professional_application(
  p_full_name text,
  p_phone text,
  p_email text,
  p_experience text,
  p_work_mode text,
  p_about text,
  p_service_slugs text[],
  p_area_slugs text[]
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_service_ids uuid[];
  v_area_ids uuid[];
begin
  select array_agg(id) into v_service_ids
    from public.services where is_active and slug = any (p_service_slugs);
  select array_agg(id) into v_area_ids
    from public.areas where is_active and slug = any (p_area_slugs);

  if coalesce(cardinality(v_service_ids), 0) = 0
     or cardinality(v_service_ids) <> (select count(distinct s) from unnest(p_service_slugs) s) then
    raise exception 'Unknown or missing services' using errcode = '22023';
  end if;
  if coalesce(cardinality(v_area_ids), 0) = 0
     or cardinality(v_area_ids) <> (select count(distinct a) from unnest(p_area_slugs) a) then
    raise exception 'Unknown or missing areas' using errcode = '22023';
  end if;

  insert into public.professional_applications
    (full_name, phone, email, experience, work_mode, about)
  values
    (btrim(p_full_name), p_phone, nullif(btrim(p_email), ''), p_experience,
     p_work_mode, nullif(btrim(p_about), ''))
  on conflict (phone) do nothing
  returning id into v_id;

  -- Same phone already applied: succeed quietly, and reveal nothing about it.
  if v_id is null then
    return;
  end if;

  insert into public.application_services (application_id, service_id)
    select v_id, unnest(v_service_ids);
  insert into public.application_areas (application_id, area_id)
    select v_id, unnest(v_area_ids);
end;
$$;

revoke all on function public.submit_professional_application(text, text, text, text, text, text, text[], text[]) from public;
grant execute on function public.submit_professional_application(text, text, text, text, text, text, text[], text[]) to anon, authenticated;
