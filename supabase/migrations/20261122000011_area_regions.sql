-- Areas now belong to a region (Greater Accra, Ashanti or Central) and can carry
-- map coordinates, so the site can suggest the nearest area to a customer.

alter table public.areas
  add column region text not null default 'Ashanti' check (region in ('Greater Accra', 'Ashanti', 'Central')),
  add column latitude double precision check (latitude between -90 and 90),
  add column longitude double precision check (longitude between -180 and 180),
  add column kind text;

create index areas_region_idx on public.areas (region, name);

drop function public.admin_add_area(text);
create function public.admin_add_area(p_name text, p_region text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare v_id uuid; v_slug text; v_name text := btrim(coalesce(p_name, ''));
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if char_length(v_name) not between 2 and 60 then
    raise exception 'Name must be 2 to 60 characters' using errcode = '22023';
  end if;
  if p_region not in ('Greater Accra', 'Ashanti', 'Central') then
    raise exception 'Unknown region' using errcode = '22023';
  end if;
  v_slug := lower(regexp_replace(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'));
  if p_region <> 'Ashanti' then v_slug := v_slug || '-' || lower(replace(p_region, ' ', '-')); end if;
  if v_slug = '' or exists (select 1 from public.areas where slug = v_slug) then
    raise exception 'That area already exists' using errcode = '23505';
  end if;
  insert into public.areas (slug, name, region, sort_order) values (v_slug, v_name, p_region, 0) returning id into v_id;
  perform public.log_admin_action('area.create', 'area', v_id::text, jsonb_build_object('name', v_name, 'region', p_region));
  return v_id;
end;
$$;
revoke execute on function public.admin_add_area(text, text) from public, anon;
grant execute on function public.admin_add_area(text, text) to authenticated;
