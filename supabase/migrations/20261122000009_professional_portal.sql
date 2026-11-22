-- Professional portal: request more work, edit profile, manage portfolio.

create table public.professional_service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.professional_profiles (user_id) on delete cascade,
  service_id uuid references public.services (id) on delete restrict,
  requested_name text check (requested_name is null or char_length(requested_name) between 2 and 80),
  requested_category_id uuid references public.service_categories (id) on delete restrict,
  reason text not null check (char_length(reason) between 10 and 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  admin_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  check ((service_id is not null) <> (requested_name is not null))
);
create unique index psr_one_pending_service on public.professional_service_requests (user_id, service_id)
  where status = 'pending' and service_id is not null;
create index psr_user_idx on public.professional_service_requests (user_id);
create index psr_status_idx on public.professional_service_requests (status, created_at desc);
create index psr_service_idx on public.professional_service_requests (service_id);
create index psr_category_idx on public.professional_service_requests (requested_category_id);
alter table public.professional_service_requests enable row level security;

create policy "Professionals read their own work requests" on public.professional_service_requests
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Admins read all work requests" on public.professional_service_requests
  for select to authenticated using (public.is_admin());
-- No insert/update policies: requests are made and decided only through the functions below.

create or replace function public.request_more_work(
  p_service_slug text, p_other_name text, p_category_slug text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_reason text := btrim(coalesce(p_reason, ''));
  v_service uuid;
  v_category uuid;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  if not exists (select 1 from public.professional_profiles pp join public.profiles p on p.id = pp.user_id
                 where pp.user_id = v_uid and p.status = 'active') then
    raise exception 'No professional profile' using errcode = '42501';
  end if;
  if char_length(v_reason) not between 10 and 500 then
    raise exception 'Reason must be 10 to 500 characters' using errcode = '22023';
  end if;
  if (select count(*) from public.professional_service_requests where user_id = v_uid and status = 'pending') >= 10 then
    raise exception 'Too many pending requests' using errcode = '22023';
  end if;

  if coalesce(p_service_slug, '') <> '' then
    select id into v_service from public.services where slug = p_service_slug and is_active;
    if v_service is null then raise exception 'Unknown service' using errcode = '22023'; end if;
    if exists (select 1 from public.professional_services where user_id = v_uid and service_id = v_service) then
      raise exception 'Already offered' using errcode = '22023';
    end if;
    if exists (select 1 from public.professional_service_requests where user_id = v_uid and service_id = v_service and status = 'pending') then
      raise exception 'Already requested' using errcode = '22023';
    end if;
    insert into public.professional_service_requests (user_id, service_id, reason) values (v_uid, v_service, v_reason);
  else
    if char_length(btrim(coalesce(p_other_name, ''))) not between 2 and 80 then
      raise exception 'Name must be 2 to 80 characters' using errcode = '22023';
    end if;
    if coalesce(p_category_slug, '') <> '' then
      select id into v_category from public.service_categories where slug = p_category_slug and is_active;
    end if;
    insert into public.professional_service_requests (user_id, requested_name, requested_category_id, reason)
    values (v_uid, btrim(p_other_name), v_category, v_reason);
  end if;
end;
$$;

create or replace function public.admin_decide_service_request(p_id uuid, p_decision text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.professional_service_requests%rowtype;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_decision not in ('approved', 'declined') then raise exception 'Invalid decision' using errcode = '22023'; end if;
  if p_decision = 'declined' and v_note is null then raise exception 'A reason is required' using errcode = '22023'; end if;
  select * into v_req from public.professional_service_requests where id = p_id and status = 'pending' for update;
  if not found then raise exception 'Request not found or already decided' using errcode = '22023'; end if;

  update public.professional_service_requests
    set status = p_decision, admin_note = v_note, decided_at = now(), decided_by = (select auth.uid())
    where id = p_id;
  if p_decision = 'approved' and v_req.service_id is not null then
    insert into public.professional_services (user_id, service_id) values (v_req.user_id, v_req.service_id)
      on conflict do nothing;
  end if;
  perform public.log_admin_action('workrequest.' || p_decision, 'professional', v_req.user_id::text,
    jsonb_build_object('request', p_id, 'service', v_req.service_id, 'name', v_req.requested_name, 'note', v_note));
end;
$$;

-- Edit own profile. Changing the public name or description of a verified profile sends it back for review.
create or replace function public.update_professional_profile(
  p_display_name text, p_description text, p_work_address text, p_extra_experience text, p_area_slugs text[])
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_cur public.professional_profiles%rowtype;
  v_name text := nullif(btrim(coalesce(p_display_name, '')), '');
  v_desc text := btrim(coalesce(p_description, ''));
  v_area_ids uuid[];
  v_status text;
  v_note text;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  select * into v_cur from public.professional_profiles where user_id = v_uid;
  if not found then raise exception 'No professional profile' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = v_uid and status <> 'active') then
    raise exception 'Account suspended' using errcode = '42501';
  end if;
  if v_name is not null and char_length(v_name) not between 2 and 100 then
    raise exception 'Display name must be 2 to 100 characters' using errcode = '22023';
  end if;
  if char_length(v_desc) not between 20 and 600 then
    raise exception 'Description must be 20 to 600 characters' using errcode = '22023';
  end if;
  select array_agg(id) into v_area_ids from public.areas where is_active and slug = any (p_area_slugs);
  if coalesce(cardinality(v_area_ids), 0) = 0
     or cardinality(v_area_ids) <> (select count(distinct a) from unnest(p_area_slugs) a) then
    raise exception 'Unknown or missing areas' using errcode = '22023';
  end if;

  v_status := v_cur.status;
  v_note := v_cur.status_note;
  if v_cur.status = 'approved' and (v_name is distinct from v_cur.display_name or v_desc is distinct from v_cur.description) then
    v_status := 'under_review';
    v_note := 'You changed your public profile. We will review the change.';
  end if;

  update public.professional_profiles
    set display_name = v_name, description = v_desc,
        work_address = nullif(left(btrim(coalesce(p_work_address, '')), 200), ''),
        extra_experience = nullif(left(btrim(coalesce(p_extra_experience, '')), 600), ''),
        status = v_status, status_note = v_note
    where user_id = v_uid;
  delete from public.professional_areas where user_id = v_uid;
  insert into public.professional_areas (user_id, area_id) select v_uid, unnest(v_area_ids);
  return v_status;
end;
$$;

create or replace function public.add_professional_documents(p_documents jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_doc jsonb;
  v_new_portfolio int;
  v_new_cert int;
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  if jsonb_typeof(coalesce(p_documents, '[]'::jsonb)) <> 'array' or jsonb_array_length(p_documents) > 6 then
    raise exception 'Too many files at once' using errcode = '22023';
  end if;
  select count(*) filter (where d ->> 'kind' = 'portfolio'), count(*) filter (where d ->> 'kind' = 'certificate')
    into v_new_portfolio, v_new_cert from jsonb_array_elements(p_documents) d;
  if (select count(*) from public.professional_documents where user_id = v_uid and kind = 'portfolio') + v_new_portfolio > 12
     or (select count(*) from public.professional_documents where user_id = v_uid and kind = 'certificate') + v_new_cert > 8 then
    raise exception 'File limit reached' using errcode = '22023';
  end if;
  for v_doc in select * from jsonb_array_elements(p_documents) loop
    if v_doc ->> 'kind' not in ('portfolio', 'certificate') then
      raise exception 'Invalid file type' using errcode = '22023';
    end if;
    insert into public.professional_documents (user_id, kind, storage_path, file_name, content_type, size_bytes)
    values (v_uid, v_doc ->> 'kind', v_doc ->> 'path', v_doc ->> 'name', v_doc ->> 'type', (v_doc ->> 'size')::bigint);
  end loop;
end;
$$;

create or replace function public.remove_professional_document(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare v_path text;
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  delete from public.professional_documents
    where id = p_id and user_id = auth.uid() and kind in ('portfolio', 'certificate')
    returning storage_path into v_path;
  return v_path;
end;
$$;

create policy "Professionals remove their own uploads" on storage.objects
  for delete to authenticated using (
    bucket_id = 'professional-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text
  );

revoke all on function public.request_more_work(text, text, text, text),
  public.admin_decide_service_request(uuid, text, text),
  public.update_professional_profile(text, text, text, text, text[]),
  public.add_professional_documents(jsonb),
  public.remove_professional_document(uuid) from public, anon;
grant execute on function public.request_more_work(text, text, text, text),
  public.admin_decide_service_request(uuid, text, text),
  public.update_professional_profile(text, text, text, text, text[]),
  public.add_professional_documents(jsonb),
  public.remove_professional_document(uuid) to authenticated;
