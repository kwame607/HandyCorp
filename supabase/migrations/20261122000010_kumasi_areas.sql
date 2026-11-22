-- Kumasi neighbourhoods, plus admin tools to add or hide areas.
-- The list is compiled from general knowledge of Kumasi, not an official gazetteer.
-- Admins can add missing areas or hide wrong ones from the Areas page.

update public.areas set sort_order = 0;

insert into public.areas (slug, name, sort_order)
select lower(regexp_replace(regexp_replace(n, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')), n, 0
from unnest(array[
  'Abrepo','Aboabo','Abuakwa','Adiebeba','Adoato','Adum','Ahenema Kokoben','Ahinsan','Ahodwo','Amakom',
  'Anloga','Apire','Asafo','Ash Town','Asokore Mampong','Asokwa','Asuoyeboah','Atasomanso','Atonsu','Ayeduase',
  'Ayigya','Bantama','Bomso','Breman','Buokrom','Chirapatre','Daban','Danyame','Dichemso','Emena',
  'Fante New Town','Gyenyase','Kejetia','Kentinkrono','KNUST area','Kotei','Kronum','Krofrom','Kwadaso','Kwadaso Estate',
  'Maakro','Manhyia','Moshie Zongo','Nhyiaeso','Nsenie','Oduom','Oforikrom','Old Tafo','Pankrono','Patasi',
  'Ridge','Roman Hill','Santasi','Sawaba','Sepe Buokrom','Sokoban','Subin','Suame','Suame Magazine','Suntreso',
  'Tafo','Tanoso','Tech Junction'
]) as n
on conflict (slug) do nothing;

create or replace function public.admin_add_area(p_name text)
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
  v_slug := lower(regexp_replace(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'));
  if v_slug = '' then raise exception 'Name must be 2 to 60 characters' using errcode = '22023'; end if;
  if exists (select 1 from public.areas where slug = v_slug) then
    raise exception 'That area already exists' using errcode = '23505';
  end if;
  insert into public.areas (slug, name, sort_order) values (v_slug, v_name, 0) returning id into v_id;
  perform public.log_admin_action('area.create', 'area', v_id::text, jsonb_build_object('name', v_name));
  return v_id;
end;
$$;

create or replace function public.admin_set_area_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.areas set is_active = p_active where id = p_id;
  if not found then raise exception 'Unknown area' using errcode = '22023'; end if;
  perform public.log_admin_action(case when p_active then 'area.activate' else 'area.deactivate' end, 'area', p_id::text, '{}'::jsonb);
end;
$$;

revoke execute on function public.admin_add_area(text), public.admin_set_area_active(uuid, boolean) from public, anon;
grant execute on function public.admin_add_area(text), public.admin_set_area_active(uuid, boolean) to authenticated;

create policy "Admins read all areas" on public.areas for select to authenticated using (public.is_admin());
