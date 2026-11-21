-- Admin panel: account status, audit log, list/search functions, category management.

alter table public.profiles
  add column status text not null default 'active' check (status in ('active', 'suspended'));

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
alter table public.admin_audit_log enable row level security;
create policy "Admins read the audit log" on public.admin_audit_log
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: entries are written only by the functions below.

create or replace function public.log_admin_action(p_action text, p_type text, p_target text, p_detail jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, detail)
  values ((select auth.uid()), p_action, p_type, p_target, coalesce(p_detail, '{}'::jsonb));
$$;
revoke all on function public.log_admin_action(text, text, text, jsonb) from public, anon, authenticated;

-- Verification decisions (replaces the earlier version, now with a reason rule and a log entry).
create or replace function public.admin_set_professional_status(p_user uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old text;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_status in ('rejected', 'more_info_required') and v_note is null then
    raise exception 'A reason is required' using errcode = '22023';
  end if;
  select status into v_old from public.professional_profiles where user_id = p_user;
  if not found then
    raise exception 'Unknown registration' using errcode = '22023';
  end if;
  update public.professional_profiles set status = p_status, status_note = v_note where user_id = p_user;
  perform public.log_admin_action('professional.status', 'professional', p_user::text,
    jsonb_build_object('from', v_old, 'to', p_status, 'note', v_note));
end;
$$;

create or replace function public.admin_set_account_status(p_user uuid, p_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_reason text := nullif(left(btrim(coalesce(p_reason, '')), 500), '');
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid status' using errcode = '22023';
  end if;
  if p_status = 'suspended' and v_reason is null then
    raise exception 'A reason is required' using errcode = '22023';
  end if;
  select role into v_role from public.profiles where id = p_user;
  if v_role is null then
    raise exception 'Unknown account' using errcode = '22023';
  end if;
  if v_role = 'admin' or p_user = (select auth.uid()) then
    raise exception 'Administrator accounts cannot be changed here' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user;
  perform public.log_admin_action('account.' || p_status, v_role, p_user::text, jsonb_build_object('reason', v_reason));
end;
$$;

-- Lists with email (emails live in the private auth schema, so only these admin-checked functions read them).
create or replace function public.admin_list_customers(
  p_q text, p_status text, p_from date, p_to date, p_limit int, p_offset int)
returns table (id uuid, full_name text, phone text, email text, status text, created_at timestamptz, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.phone, u.email::text, p.status, p.created_at, count(*) over ()
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
    and p.role = 'customer'
    and (coalesce(p_q, '') = '' or p.full_name ilike '%' || p_q || '%' or coalesce(p.phone, '') ilike '%' || p_q || '%' or u.email ilike '%' || p_q || '%')
    and (coalesce(p_status, '') = '' or p.status = p_status)
    and (p_from is null or p.created_at >= p_from)
    and (p_to is null or p.created_at < p_to + 1)
  order by p.created_at desc
  limit least(coalesce(p_limit, 20), 100) offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.admin_list_professionals(
  p_q text, p_status text, p_category text, p_location text, p_account text, p_limit int, p_offset int)
returns table (user_id uuid, full_name text, display_name text, email text, phone text, category text,
               city text, area text, status text, account_status text, submitted_at timestamptz, total bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select pp.user_id, p.full_name, pp.display_name, u.email::text, p.phone, c.name, pp.city, pp.area,
         pp.status, p.status, pp.submitted_at, count(*) over ()
  from public.professional_profiles pp
  join public.profiles p on p.id = pp.user_id
  join auth.users u on u.id = pp.user_id
  join public.service_categories c on c.id = pp.main_category_id
  where public.is_admin()
    and (coalesce(p_q, '') = '' or p.full_name ilike '%' || p_q || '%' or coalesce(pp.display_name, '') ilike '%' || p_q || '%'
         or coalesce(p.phone, '') ilike '%' || p_q || '%' or u.email ilike '%' || p_q || '%')
    and (coalesce(p_status, '') = '' or pp.status = p_status)
    and (coalesce(p_category, '') = '' or c.slug = p_category)
    and (coalesce(p_location, '') = '' or pp.city ilike '%' || p_location || '%' or pp.area ilike '%' || p_location || '%')
    and (coalesce(p_account, '') = '' or p.status = p_account)
  order by pp.submitted_at desc
  limit least(coalesce(p_limit, 20), 100) offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.admin_get_user(p_id uuid)
returns table (email text, created_at timestamptz, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text, u.created_at, u.last_sign_in_at from auth.users u where public.is_admin() and u.id = p_id;
$$;

create or replace function public.admin_list_admins()
returns table (id uuid, full_name text, email text, last_sign_in_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, u.email::text, u.last_sign_in_at
  from public.profiles p join auth.users u on u.id = p.id
  where public.is_admin() and p.role = 'admin' order by p.created_at;
$$;

revoke all on function public.admin_set_account_status(uuid, text, text),
  public.admin_list_customers(text, text, date, date, int, int),
  public.admin_list_professionals(text, text, text, text, text, int, int),
  public.admin_get_user(uuid),
  public.admin_list_admins() from public, anon;
grant execute on function public.admin_set_account_status(uuid, text, text),
  public.admin_list_customers(text, text, date, date, int, int),
  public.admin_list_professionals(text, text, text, text, text, int, int),
  public.admin_get_user(uuid),
  public.admin_list_admins() to authenticated;

-- Category and service management. Rows are never deleted, only deactivated (they may be referenced later).
create or replace function public.admin_slugify(p_text text, p_table text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_base text := trim(both '-' from regexp_replace(lower(p_text), '[^a-z0-9]+', '-', 'g'));
  v_slug text := v_base;
  v_taken boolean;
begin
  if v_base = '' then v_base := 'item'; v_slug := v_base; end if;
  loop
    if p_table = 'category' then
      select exists (select 1 from public.service_categories where slug = v_slug) into v_taken;
    else
      select exists (select 1 from public.services where slug = v_slug) into v_taken;
    end if;
    exit when not v_taken;
    v_slug := v_base || '-' || substr(md5(random()::text), 1, 4);
  end loop;
  return v_slug;
end;
$$;
revoke all on function public.admin_slugify(text, text) from public, anon, authenticated;

create or replace function public.admin_create_category(p_name text, p_summary text, p_description text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then
    raise exception 'Name must be 2 to 80 characters' using errcode = '22023';
  end if;
  insert into public.service_categories (slug, name, summary, description, photo_alt, sort_order)
  values (public.admin_slugify(p_name, 'category'), btrim(p_name), left(btrim(coalesce(p_summary, '')), 200),
          left(btrim(coalesce(p_description, '')), 1000), '',
          coalesce((select max(sort_order) + 1 from public.service_categories), 1))
  returning id into v_id;
  perform public.log_admin_action('category.create', 'category', v_id::text, jsonb_build_object('name', btrim(p_name)));
  return v_id;
end;
$$;

create or replace function public.admin_update_category(p_id uuid, p_name text, p_summary text, p_description text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then
    raise exception 'Name must be 2 to 80 characters' using errcode = '22023';
  end if;
  update public.service_categories
    set name = btrim(p_name), summary = left(btrim(coalesce(p_summary, '')), 200),
        description = left(btrim(coalesce(p_description, '')), 1000)
    where id = p_id;
  if not found then raise exception 'Unknown category' using errcode = '22023'; end if;
  perform public.log_admin_action('category.update', 'category', p_id::text, jsonb_build_object('name', btrim(p_name)));
end;
$$;

create or replace function public.admin_set_category_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.service_categories set is_active = p_active where id = p_id;
  if not found then raise exception 'Unknown category' using errcode = '22023'; end if;
  perform public.log_admin_action(case when p_active then 'category.activate' else 'category.deactivate' end,
    'category', p_id::text, '{}'::jsonb);
end;
$$;

create or replace function public.admin_add_service(p_category uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then
    raise exception 'Name must be 2 to 80 characters' using errcode = '22023';
  end if;
  insert into public.services (category_id, slug, name, sort_order)
  values (p_category, public.admin_slugify(p_name, 'service'), btrim(p_name),
          coalesce((select max(sort_order) + 1 from public.services where category_id = p_category), 1))
  returning id into v_id;
  perform public.log_admin_action('service.create', 'service', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'category', p_category));
  return v_id;
end;
$$;

create or replace function public.admin_set_service_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.services set is_active = p_active where id = p_id;
  if not found then raise exception 'Unknown service' using errcode = '22023'; end if;
  perform public.log_admin_action(case when p_active then 'service.activate' else 'service.deactivate' end,
    'service', p_id::text, '{}'::jsonb);
end;
$$;

revoke all on function public.admin_create_category(text, text, text), public.admin_update_category(uuid, text, text, text),
  public.admin_set_category_active(uuid, boolean), public.admin_add_service(uuid, text),
  public.admin_set_service_active(uuid, boolean) from public, anon;
grant execute on function public.admin_create_category(text, text, text), public.admin_update_category(uuid, text, text, text),
  public.admin_set_category_active(uuid, boolean), public.admin_add_service(uuid, text),
  public.admin_set_service_active(uuid, boolean) to authenticated;

-- Admins also need to see inactive catalogue rows.
create policy "Admins read all categories" on public.service_categories
  for select to authenticated using (public.is_admin());
create policy "Admins read all services" on public.services
  for select to authenticated using (public.is_admin());
