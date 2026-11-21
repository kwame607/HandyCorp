-- Admin review of professional registrations.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Admins read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "Admins read all registrations" on public.professional_profiles
  for select to authenticated using (public.is_admin());
create policy "Admins read all professional services" on public.professional_services
  for select to authenticated using (public.is_admin());
create policy "Admins read all professional areas" on public.professional_areas
  for select to authenticated using (public.is_admin());
create policy "Admins read all professional documents" on public.professional_documents
  for select to authenticated using (public.is_admin());
create policy "Admins read all uploads" on storage.objects
  for select to authenticated using (bucket_id = 'professional-uploads' and public.is_admin());

-- The only way to change a status. Admins only; changes nothing else.
create or replace function public.admin_set_professional_status(p_user uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  update public.professional_profiles
    set status = p_status, status_note = nullif(left(btrim(coalesce(p_note, '')), 500), '')
    where user_id = p_user;
  if not found then
    raise exception 'Unknown registration' using errcode = '22023';
  end if;
end;
$$;
revoke all on function public.admin_set_professional_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_professional_status(uuid, text, text) to authenticated;
