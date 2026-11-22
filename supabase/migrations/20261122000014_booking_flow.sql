-- Booking flow, first slice: requests -> invitations -> messages -> quotations -> bookings.
-- No payments yet. Every change goes through a function that checks who is asking;
-- there are no direct insert/update policies for customers or professionals.

create sequence public.request_ref_seq;
create sequence public.quotation_ref_seq;
create sequence public.booking_ref_seq;

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('REQ-' || lpad(nextval('public.request_ref_seq')::text, 5, '0')),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete restrict,
  area_id uuid not null references public.areas (id) on delete restrict,
  description text not null check (char_length(description) between 10 and 1000),
  preferred_date date,
  time_note text check (char_length(time_note) <= 200),
  budget numeric(12, 2) check (budget is null or budget > 0),
  status text not null default 'open' check (status in ('open', 'booked', 'cancelled')),
  created_at timestamptz not null default now()
);
create index service_requests_customer_idx on public.service_requests (customer_id, created_at desc);
create index service_requests_service_idx on public.service_requests (service_id);
create index service_requests_area_idx on public.service_requests (area_id);
create index service_requests_status_idx on public.service_requests (status, created_at desc);

-- The exact address is kept apart: professionals only get it once they are booked.
create table public.request_locations (
  request_id uuid primary key references public.service_requests (id) on delete cascade,
  address text not null check (char_length(address) between 3 and 300),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180)
);

create table public.request_photos (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  created_at timestamptz not null default now()
);
create index request_photos_request_idx on public.request_photos (request_id);

create table public.request_invitations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests (id) on delete cascade,
  professional_id uuid not null references public.professional_profiles (user_id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'declined', 'quoted', 'closed')),
  decline_reason text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_id, professional_id)
);
create index request_invitations_pro_idx on public.request_invitations (professional_id, status);

create table public.request_messages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.request_invitations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index request_messages_invitation_idx on public.request_messages (invitation_id, created_at);
create index request_messages_sender_idx on public.request_messages (sender_id);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  ref text not null default ('QUO-' || lpad(nextval('public.quotation_ref_seq')::text, 5, '0')),
  invitation_id uuid not null references public.request_invitations (id) on delete cascade,
  request_id uuid not null references public.service_requests (id) on delete cascade,
  professional_id uuid not null references public.professional_profiles (user_id) on delete cascade,
  version int not null default 1,
  status text not null default 'submitted' check (status in ('submitted', 'accepted', 'declined', 'withdrawn', 'superseded', 'closed')),
  scope text not null check (char_length(scope) between 10 and 1000),
  duration_note text check (char_length(duration_note) <= 200),
  proposed_start date,
  expires_at date not null,
  exclusions text check (char_length(exclusions) <= 500),
  warranty text check (char_length(warranty) <= 300),
  total numeric(12, 2) not null check (total > 0),
  withdraw_reason text,
  decline_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (invitation_id, version)
);
create index quotations_request_idx on public.quotations (request_id);
create index quotations_pro_idx on public.quotations (professional_id);

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  kind text not null check (kind in ('labour', 'materials', 'other')),
  description text not null check (char_length(description) between 2 and 120),
  amount numeric(12, 2) not null check (amount > 0),
  sort int not null default 0
);
create index quotation_items_quotation_idx on public.quotation_items (quotation_id);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('BKG-' || lpad(nextval('public.booking_ref_seq')::text, 5, '0')),
  request_id uuid not null unique references public.service_requests (id) on delete restrict,
  quotation_id uuid not null unique references public.quotations (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  professional_id uuid not null references public.professional_profiles (user_id) on delete restrict,
  agreed_total numeric(12, 2) not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'in_progress', 'completed', 'cancelled')),
  cancel_reason text,
  cancelled_by uuid references public.profiles (id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index bookings_customer_idx on public.bookings (customer_id, created_at desc);
create index bookings_pro_idx on public.bookings (professional_id, created_at desc);
create index bookings_cancelled_by_idx on public.bookings (cancelled_by);

alter table public.service_requests enable row level security;
alter table public.request_locations enable row level security;
alter table public.request_photos enable row level security;
alter table public.request_invitations enable row level security;
alter table public.request_messages enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.bookings enable row level security;

-- Helpers that read the tables as the system, so the policies below never loop into each other.
create function public.is_request_customer(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.service_requests r where r.id = p_request and r.customer_id = (select auth.uid()));
$$;
create function public.is_request_invited(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.request_invitations i where i.request_id = p_request and i.professional_id = (select auth.uid()));
$$;
create function public.is_request_booked_pro(p_request uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.bookings b where b.request_id = p_request and b.professional_id = (select auth.uid()) and b.status <> 'cancelled');
$$;
create function public.is_invitation_party(p_invitation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.request_invitations i join public.service_requests r on r.id = i.request_id
    where i.id = p_invitation and (i.professional_id = (select auth.uid()) or r.customer_id = (select auth.uid()))
  );
$$;
create function public.can_see_quotation(p_quotation uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.quotations q
    where q.id = p_quotation and (q.professional_id = (select auth.uid()) or public.is_request_customer(q.request_id))
  );
$$;
revoke execute on function public.is_request_customer(uuid), public.is_request_invited(uuid), public.is_request_booked_pro(uuid),
  public.is_invitation_party(uuid), public.can_see_quotation(uuid) from public, anon;
grant execute on function public.is_request_customer(uuid), public.is_request_invited(uuid), public.is_request_booked_pro(uuid),
  public.is_invitation_party(uuid), public.can_see_quotation(uuid) to authenticated;

create policy "Read own or invited requests" on public.service_requests for select to authenticated
  using (customer_id = (select auth.uid()) or public.is_request_invited(id) or public.has_permission('bookings.view'));
create policy "Read request address" on public.request_locations for select to authenticated
  using (public.is_request_customer(request_id) or public.is_request_booked_pro(request_id) or public.has_permission('bookings.view'));
create policy "Read request photos" on public.request_photos for select to authenticated
  using (public.is_request_customer(request_id) or public.is_request_invited(request_id) or public.has_permission('bookings.view'));
create policy "Read invitations" on public.request_invitations for select to authenticated
  using (professional_id = (select auth.uid()) or public.is_request_customer(request_id) or public.has_permission('bookings.view'));
create policy "Read messages" on public.request_messages for select to authenticated
  using (public.is_invitation_party(invitation_id) or public.has_permission('support.view'));
create policy "Read quotations" on public.quotations for select to authenticated
  using (professional_id = (select auth.uid()) or public.is_request_customer(request_id) or public.has_permission('bookings.view'));
create policy "Read quotation items" on public.quotation_items for select to authenticated
  using (public.can_see_quotation(quotation_id) or public.has_permission('bookings.view'));
create policy "Read bookings" on public.bookings for select to authenticated
  using (customer_id = (select auth.uid()) or professional_id = (select auth.uid()) or public.has_permission('bookings.view'));

-- ---------- Photos for requests ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-uploads', 'request-uploads', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Customers upload request photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'request-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Customers remove their request photos" on storage.objects for delete to authenticated
  using (bucket_id = 'request-uploads' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Read request photo files" on storage.objects for select to authenticated
  using (
    bucket_id = 'request-uploads'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.has_permission('bookings.view')
      or exists (select 1 from public.request_photos rp where rp.storage_path = name and public.is_request_invited(rp.request_id))
    )
  );

-- ---------- Who can be asked: verified, active, offers the service, covers the area ----------
create function public.eligible_professionals(p_service_slug text, p_area_slug text)
returns table (user_id uuid, name text, description text, experience text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  return query
    select pp.user_id, coalesce(nullif(btrim(pp.display_name), ''), pr.full_name), pp.description, pp.experience
    from public.professional_profiles pp
    join public.profiles pr on pr.id = pp.user_id
    where pp.status = 'approved' and pr.status = 'active' and pp.user_id <> (select auth.uid())
      and exists (select 1 from public.professional_services ps join public.services s on s.id = ps.service_id where ps.user_id = pp.user_id and s.slug = p_service_slug and s.is_active)
      and exists (select 1 from public.professional_areas pa join public.areas a on a.id = pa.area_id where pa.user_id = pp.user_id and a.slug = p_area_slug and a.is_active)
    order by md5(pp.user_id::text || current_date::text)
    limit 20;
end;
$$;

-- ---------- Customer: send a request ----------
create function public.create_service_request(
  p_service_slug text, p_area_slug text, p_description text, p_address text,
  p_lat double precision, p_lng double precision, p_date date, p_time_note text,
  p_budget numeric, p_professionals uuid[], p_photos jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_role text; v_status text; v_service uuid; v_area uuid; v_id uuid; v_pro uuid; v_photo jsonb;
  v_pros uuid[] := coalesce(p_professionals, array[]::uuid[]);
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  select role, status into v_role, v_status from public.profiles where id = v_uid;
  if v_role is distinct from 'customer' or v_status is distinct from 'active' then raise exception 'Only customers can send requests' using errcode = '42501'; end if;
  select id into v_service from public.services where slug = p_service_slug and is_active;
  if v_service is null then raise exception 'Unknown service' using errcode = '22023'; end if;
  select id into v_area from public.areas where slug = p_area_slug and is_active;
  if v_area is null then raise exception 'Unknown area' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_description, ''))) not between 10 and 1000 then raise exception 'Description must be 10 to 1000 characters' using errcode = '22023'; end if;
  if char_length(btrim(coalesce(p_address, ''))) not between 3 and 300 then raise exception 'Enter the address' using errcode = '22023'; end if;
  if p_date is not null and (p_date < current_date or p_date > current_date + 180) then raise exception 'Choose a date within the next 6 months' using errcode = '22023'; end if;
  if p_budget is not null and p_budget <= 0 then raise exception 'Budget must be more than zero' using errcode = '22023'; end if;
  if array_length(v_pros, 1) > 5 then raise exception 'Choose up to 5 professionals' using errcode = '22023'; end if;
  if jsonb_typeof(coalesce(p_photos, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_photos, '[]'::jsonb)) > 6 then raise exception 'Up to 6 photos' using errcode = '22023'; end if;

  -- every chosen professional must really be eligible
  foreach v_pro in array v_pros loop
    if not exists (select 1 from public.eligible_professionals(p_service_slug, p_area_slug) e where e.user_id = v_pro) then
      raise exception 'One of the professionals is not available for this request' using errcode = '22023';
    end if;
  end loop;

  insert into public.service_requests (customer_id, service_id, area_id, description, preferred_date, time_note, budget)
  values (v_uid, v_service, v_area, btrim(p_description), p_date, nullif(btrim(coalesce(p_time_note, '')), ''), p_budget)
  returning id into v_id;
  insert into public.request_locations (request_id, address, latitude, longitude) values (v_id, btrim(p_address), p_lat, p_lng);

  for v_photo in select * from jsonb_array_elements(coalesce(p_photos, '[]'::jsonb)) loop
    if (v_photo ->> 'path') not like v_uid::text || '/%' then raise exception 'Invalid photo' using errcode = '22023'; end if;
    insert into public.request_photos (request_id, storage_path, file_name) values (v_id, v_photo ->> 'path', left(coalesce(v_photo ->> 'name', 'photo'), 200));
  end loop;

  insert into public.request_invitations (request_id, professional_id) select v_id, unnest(v_pros);
  return v_id;
end;
$$;

create function public.cancel_service_request(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.service_requests set status = 'cancelled' where id = p_id and customer_id = (select auth.uid()) and status = 'open';
  if not found then raise exception 'This request cannot be cancelled' using errcode = '22023'; end if;
  update public.request_invitations set status = 'closed', responded_at = coalesce(responded_at, now()) where request_id = p_id and status in ('invited', 'quoted');
  update public.quotations set status = 'closed', decided_at = now() where request_id = p_id and status = 'submitted';
end;
$$;

-- ---------- Professional: respond ----------
create function public.decline_invitation(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.request_invitations i set status = 'declined', decline_reason = left(nullif(btrim(coalesce(p_reason, '')), ''), 300), responded_at = now()
  where i.id = p_id and i.professional_id = (select auth.uid()) and i.status = 'invited'
    and exists (select 1 from public.service_requests r where r.id = i.request_id and r.status = 'open');
  if not found then raise exception 'This request cannot be declined' using errcode = '22023'; end if;
end;
$$;

create function public.post_request_message(p_invitation uuid, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_body text := btrim(coalesce(p_body, ''));
begin
  if v_uid is null then raise exception 'Not signed in' using errcode = '28000'; end if;
  if char_length(v_body) not between 1 and 1000 then raise exception 'Message must be 1 to 1000 characters' using errcode = '22023'; end if;
  if not public.is_invitation_party(p_invitation) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.request_invitations i join public.service_requests r on r.id = i.request_id
    where i.id = p_invitation and i.status in ('invited', 'quoted') and r.status = 'open'
  ) and not exists (
    select 1 from public.bookings b join public.quotations q on q.id = b.quotation_id where q.invitation_id = p_invitation and b.status in ('confirmed', 'in_progress')
  ) then raise exception 'This conversation is closed' using errcode = '22023'; end if;
  insert into public.request_messages (invitation_id, sender_id, body) values (p_invitation, v_uid, v_body);
end;
$$;

create function public.submit_quotation(
  p_invitation uuid, p_scope text, p_duration text, p_start date, p_expires date,
  p_exclusions text, p_warranty text, p_items jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid()); v_inv public.request_invitations; v_id uuid; v_ver int; v_total numeric := 0; v_item jsonb; v_n int := 0;
begin
  select * into v_inv from public.request_invitations where id = p_invitation and professional_id = v_uid for update;
  if v_inv.id is null or v_inv.status not in ('invited', 'quoted') then raise exception 'You cannot quote on this request' using errcode = '22023'; end if;
  if not exists (select 1 from public.service_requests r where r.id = v_inv.request_id and r.status = 'open') then raise exception 'This request is no longer open' using errcode = '22023'; end if;
  if not exists (select 1 from public.professional_profiles pp where pp.user_id = v_uid and pp.status = 'approved') then raise exception 'Only verified professionals can send quotations' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_scope, ''))) not between 10 and 1000 then raise exception 'Describe the work in 10 to 1000 characters' using errcode = '22023'; end if;
  if p_expires is null or p_expires < current_date or p_expires > current_date + 60 then raise exception 'Expiry must be within the next 60 days' using errcode = '22023'; end if;
  if p_start is not null and p_start < current_date then raise exception 'Start date cannot be in the past' using errcode = '22023'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 15 then raise exception 'Add 1 to 15 line items' using errcode = '22023'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if (v_item ->> 'kind') not in ('labour', 'materials', 'other') or char_length(btrim(coalesce(v_item ->> 'description', ''))) not between 2 and 120
       or coalesce((v_item ->> 'amount')::numeric, 0) <= 0 or (v_item ->> 'amount')::numeric > 10000000 then
      raise exception 'Each item needs a type, a description and an amount above zero' using errcode = '22023';
    end if;
    v_total := v_total + (v_item ->> 'amount')::numeric;
  end loop;

  select coalesce(max(version), 0) + 1 into v_ver from public.quotations where invitation_id = p_invitation;
  update public.quotations set status = 'superseded', decided_at = now() where invitation_id = p_invitation and status = 'submitted';
  insert into public.quotations (invitation_id, request_id, professional_id, version, scope, duration_note, proposed_start, expires_at, exclusions, warranty, total)
  values (p_invitation, v_inv.request_id, v_uid, v_ver, btrim(p_scope), nullif(btrim(coalesce(p_duration, '')), ''), p_start, p_expires,
          nullif(btrim(coalesce(p_exclusions, '')), ''), nullif(btrim(coalesce(p_warranty, '')), ''), v_total)
  returning id into v_id;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_n := v_n + 1;
    insert into public.quotation_items (quotation_id, kind, description, amount, sort)
    values (v_id, v_item ->> 'kind', btrim(v_item ->> 'description'), (v_item ->> 'amount')::numeric, v_n);
  end loop;
  update public.request_invitations set status = 'quoted', responded_at = coalesce(responded_at, now()) where id = p_invitation;
  return v_id;
end;
$$;

create function public.withdraw_quotation(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_inv uuid;
begin
  if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Please give a reason' using errcode = '22023'; end if;
  update public.quotations set status = 'withdrawn', withdraw_reason = left(btrim(p_reason), 300), decided_at = now()
  where id = p_id and professional_id = (select auth.uid()) and status = 'submitted' returning invitation_id into v_inv;
  if v_inv is null then raise exception 'This quotation cannot be withdrawn' using errcode = '22023'; end if;
  update public.request_invitations set status = 'invited' where id = v_inv and status = 'quoted';
end;
$$;

-- ---------- Customer: accept or decline a quotation ----------
create function public.respond_to_quotation(p_id uuid, p_decision text, p_note text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_q public.quotations; v_booking uuid;
begin
  if p_decision not in ('accepted', 'declined') then raise exception 'Unknown decision' using errcode = '22023'; end if;
  select q.* into v_q from public.quotations q join public.service_requests r on r.id = q.request_id
  where q.id = p_id and r.customer_id = v_uid for update of q;
  if v_q.id is null or v_q.status <> 'submitted' then raise exception 'This quotation is no longer available' using errcode = '22023'; end if;
  perform 1 from public.service_requests where id = v_q.request_id for update;
  if not exists (select 1 from public.service_requests where id = v_q.request_id and status = 'open') then raise exception 'This request is no longer open' using errcode = '22023'; end if;

  if p_decision = 'declined' then
    update public.quotations set status = 'declined', decline_note = left(nullif(btrim(coalesce(p_note, '')), ''), 300), decided_at = now() where id = p_id;
    update public.request_invitations set status = 'invited' where id = v_q.invitation_id and status = 'quoted';
    return null;
  end if;

  if v_q.expires_at < current_date then raise exception 'This quotation has expired. Ask for a new one.' using errcode = '22023'; end if;
  update public.quotations set status = 'accepted', decided_at = now() where id = p_id;
  update public.quotations set status = 'closed', decided_at = now() where request_id = v_q.request_id and id <> p_id and status = 'submitted';
  update public.request_invitations set status = 'closed', responded_at = coalesce(responded_at, now())
    where request_id = v_q.request_id and id <> v_q.invitation_id and status in ('invited', 'quoted');
  update public.service_requests set status = 'booked' where id = v_q.request_id;
  insert into public.bookings (request_id, quotation_id, customer_id, professional_id, agreed_total)
  values (v_q.request_id, v_q.id, v_uid, v_q.professional_id, v_q.total) returning id into v_booking;
  return v_booking;
end;
$$;

-- ---------- Booking progress ----------
create function public.update_booking_status(p_id uuid, p_status text, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); b public.bookings;
begin
  select * into b from public.bookings where id = p_id and (customer_id = v_uid or professional_id = v_uid) for update;
  if b.id is null then raise exception 'Not allowed' using errcode = '42501'; end if;
  if b.status in ('completed', 'cancelled') then raise exception 'This booking is already closed' using errcode = '22023'; end if;
  if p_status = 'in_progress' and b.professional_id = v_uid and b.status = 'confirmed' then
    update public.bookings set status = 'in_progress', started_at = now() where id = p_id;
  elsif p_status = 'completed' and b.professional_id = v_uid and b.status = 'in_progress' then
    update public.bookings set status = 'completed', completed_at = now() where id = p_id;
  elsif p_status = 'cancelled' then
    if char_length(btrim(coalesce(p_reason, ''))) < 3 then raise exception 'Please give a reason' using errcode = '22023'; end if;
    update public.bookings set status = 'cancelled', cancel_reason = left(btrim(p_reason), 300), cancelled_by = v_uid where id = p_id;
  else
    raise exception 'That change is not allowed' using errcode = '22023';
  end if;
end;
$$;

-- The other side's contact details, only for the two people on a live booking.
create function public.booking_contact(p_id uuid)
returns table (other_name text, other_phone text, address text, latitude double precision, longitude double precision)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); b public.bookings;
begin
  select * into b from public.bookings where id = p_id and (customer_id = v_uid or professional_id = v_uid);
  if b.id is null then raise exception 'Not allowed' using errcode = '42501'; end if;
  if b.status = 'cancelled' then return; end if;
  if b.professional_id = v_uid then
    return query select pr.full_name, pr.phone, l.address, l.latitude, l.longitude
      from public.profiles pr left join public.request_locations l on l.request_id = b.request_id where pr.id = b.customer_id;
  else
    return query select coalesce(nullif(btrim(pp.display_name), ''), pr.full_name), pr.phone, null::text, null::double precision, null::double precision
      from public.profiles pr join public.professional_profiles pp on pp.user_id = pr.id where pr.id = b.professional_id;
  end if;
end;
$$;

-- Names of the professionals a customer has asked, for their own request only.
create function public.request_professionals(p_request uuid)
returns table (invitation_id uuid, professional_id uuid, name text, status text, decline_reason text, responded_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_request_customer(p_request) and not public.has_permission('bookings.view') then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
    select i.id, i.professional_id, coalesce(nullif(btrim(pp.display_name), ''), pr.full_name), i.status, i.decline_reason, i.responded_at
    from public.request_invitations i
    join public.professional_profiles pp on pp.user_id = i.professional_id
    join public.profiles pr on pr.id = i.professional_id
    where i.request_id = p_request order by i.created_at;
end;
$$;

revoke execute on function public.eligible_professionals(text, text), public.create_service_request(text, text, text, text, double precision, double precision, date, text, numeric, uuid[], jsonb),
  public.cancel_service_request(uuid), public.decline_invitation(uuid, text), public.post_request_message(uuid, text),
  public.submit_quotation(uuid, text, text, date, date, text, text, jsonb), public.withdraw_quotation(uuid, text),
  public.respond_to_quotation(uuid, text, text), public.update_booking_status(uuid, text, text), public.booking_contact(uuid),
  public.request_professionals(uuid) from public, anon;
grant execute on function public.eligible_professionals(text, text), public.create_service_request(text, text, text, text, double precision, double precision, date, text, numeric, uuid[], jsonb),
  public.cancel_service_request(uuid), public.decline_invitation(uuid, text), public.post_request_message(uuid, text),
  public.submit_quotation(uuid, text, text, date, date, text, text, jsonb), public.withdraw_quotation(uuid, text),
  public.respond_to_quotation(uuid, text, text), public.update_booking_status(uuid, text, text), public.booking_contact(uuid),
  public.request_professionals(uuid) to authenticated;
