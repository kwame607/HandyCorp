-- Staff roles. is_admin still means "may enter the admin panel"; staff_role says what they may do.
-- Anyone who was already an admin becomes a Super Administrator.

alter table public.profiles
  add column staff_role text check (staff_role in ('super_admin', 'operations_manager', 'verification_officer', 'customer_support', 'finance_officer'));

update public.profiles set staff_role = 'super_admin' where is_admin and staff_role is null;

create or replace function public.staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when p.is_admin then coalesce(p.staff_role, 'super_admin') end
  from public.profiles p where p.id = (select auth.uid());
$$;

-- What each role may do. Keep in step with src/lib/permissions.ts.
create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.staff_role() = any (
    case p_permission
      when 'professionals.view'   then array['super_admin','operations_manager','verification_officer','customer_support']
      when 'professionals.verify' then array['super_admin','operations_manager','verification_officer']
      when 'workrequests.decide'  then array['super_admin','operations_manager','verification_officer']
      when 'customers.view'       then array['super_admin','operations_manager','customer_support']
      when 'accounts.manage'      then array['super_admin','operations_manager']
      when 'catalogue.manage'     then array['super_admin','operations_manager']
      when 'bookings.view'        then array['super_admin','operations_manager','customer_support']
      when 'support.view'         then array['super_admin','operations_manager','customer_support']
      when 'analytics.view'       then array['super_admin','operations_manager','finance_officer']
      when 'finance.view'         then array['super_admin','finance_officer']
      when 'staff.manage'         then array['super_admin']
      when 'audit.view'           then array['super_admin']
      else array[]::text[]
    end), false);
$$;

revoke execute on function public.staff_role(), public.has_permission(text) from public, anon;
grant execute on function public.staff_role(), public.has_permission(text) to authenticated;

-- Point each admin function at the permission it really needs.
do $$
declare
  m record;
  v_oid oid;
  v_old text;
  v_new text;
begin
  for m in select * from (values
    ('admin_add_area', 'public.has_permission(''catalogue.manage'')'),
    ('admin_set_area_active', 'public.has_permission(''catalogue.manage'')'),
    ('admin_add_service', 'public.has_permission(''catalogue.manage'')'),
    ('admin_create_category', 'public.has_permission(''catalogue.manage'')'),
    ('admin_update_category', 'public.has_permission(''catalogue.manage'')'),
    ('admin_set_category_active', 'public.has_permission(''catalogue.manage'')'),
    ('admin_set_service_active', 'public.has_permission(''catalogue.manage'')'),
    ('admin_decide_service_request', 'public.has_permission(''workrequests.decide'')'),
    ('admin_get_user', '(public.has_permission(''customers.view'') or public.has_permission(''professionals.view''))'),
    ('admin_list_customers', 'public.has_permission(''customers.view'')'),
    ('admin_list_professionals', 'public.has_permission(''professionals.view'')'),
    ('admin_set_account_status', 'public.has_permission(''accounts.manage'')'),
    ('admin_set_professional_status', 'public.has_permission(''professionals.verify'')')
  ) as t(fn, expr)
  loop
    select p.oid into strict v_oid from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = m.fn;
    v_old := pg_get_functiondef(v_oid);
    v_new := replace(v_old, 'public.is_admin()', m.expr);
    if v_new = v_old then raise exception 'No admin check found in %', m.fn; end if;
    execute v_new;
  end loop;
end $$;

-- The list of staff now includes roles, and only staff managers may see it.
drop function public.admin_list_admins();
create function public.admin_list_admins()
returns table (id uuid, full_name text, email text, last_sign_in_at timestamptz, staff_role text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, u.email::text, u.last_sign_in_at, coalesce(p.staff_role, 'super_admin')
  from public.profiles p join auth.users u on u.id = p.id
  where public.has_permission('staff.manage') and p.is_admin order by p.created_at;
$$;
revoke execute on function public.admin_list_admins() from public, anon;
grant execute on function public.admin_list_admins() to authenticated;

-- Give or take away a staff role, by email. The person must already have an account.
create or replace function public.admin_set_staff_role(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_current text;
  v_supers int;
begin
  if not public.has_permission('staff.manage') then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_role not in ('none', 'super_admin', 'operations_manager', 'verification_officer', 'customer_support', 'finance_officer') then
    raise exception 'Unknown role' using errcode = '22023';
  end if;
  select u.id into v_id from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if v_id is null then raise exception 'No account with that email' using errcode = 'P0002'; end if;
  if v_id = (select auth.uid()) then raise exception 'You cannot change your own role' using errcode = '22023'; end if;
  select case when is_admin then coalesce(staff_role, 'super_admin') end into v_current from public.profiles where id = v_id;
  if v_current = 'super_admin' and p_role <> 'super_admin' then
    select count(*) into v_supers from public.profiles where is_admin and coalesce(staff_role, 'super_admin') = 'super_admin';
    if v_supers <= 1 then raise exception 'There must always be one Super Administrator' using errcode = '22023'; end if;
  end if;
  update public.profiles
    set is_admin = (p_role <> 'none'), staff_role = case when p_role = 'none' then null else p_role end
    where id = v_id;
  perform public.log_admin_action('staff.role', 'staff', v_id::text, jsonb_build_object('from', coalesce(v_current, 'none'), 'to', p_role));
end;
$$;
revoke execute on function public.admin_set_staff_role(text, text) from public, anon;
grant execute on function public.admin_set_staff_role(text, text) to authenticated;

-- Direct reads of sensitive tables follow the same permissions.
drop policy "Admins read the audit log" on public.admin_audit_log;
create policy "Staff read the audit log" on public.admin_audit_log for select to authenticated using (public.has_permission('audit.view'));

drop policy "Admins read all professional areas" on public.professional_areas;
create policy "Staff read all professional areas" on public.professional_areas for select to authenticated using (public.has_permission('professionals.view'));
drop policy "Admins read all professional documents" on public.professional_documents;
create policy "Staff read all professional documents" on public.professional_documents for select to authenticated using (public.has_permission('professionals.view'));
drop policy "Admins read all registrations" on public.professional_profiles;
create policy "Staff read all registrations" on public.professional_profiles for select to authenticated using (public.has_permission('professionals.view'));
drop policy "Admins read all work requests" on public.professional_service_requests;
create policy "Staff read all work requests" on public.professional_service_requests for select to authenticated using (public.has_permission('professionals.view'));
drop policy "Admins read all professional services" on public.professional_services;
create policy "Staff read all professional services" on public.professional_services for select to authenticated using (public.has_permission('professionals.view'));

drop policy "Admins read all uploads" on storage.objects;
create policy "Staff read all uploads" on storage.objects for select to authenticated
  using (bucket_id = 'professional-uploads' and public.has_permission('professionals.view'));
