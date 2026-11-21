-- Admins can give a new service search words (comma separated), so people can find it by what they call it.
drop function if exists public.admin_add_service(uuid, text);

create or replace function public.admin_add_service(p_category uuid, p_name text, p_keywords text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_kw text[];
begin
  if not public.is_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if char_length(btrim(coalesce(p_name, ''))) not between 2 and 80 then
    raise exception 'Name must be 2 to 80 characters' using errcode = '22023';
  end if;
  select coalesce(array_agg(k), '{}') into v_kw from (
    select distinct lower(btrim(x)) k from unnest(string_to_array(left(coalesce(p_keywords, ''), 300), ',')) x
    where char_length(btrim(x)) between 2 and 40 limit 12
  ) s;
  insert into public.services (category_id, slug, name, keywords, sort_order)
  values (p_category, public.admin_slugify(p_name, 'service'), btrim(p_name), v_kw,
          coalesce((select max(sort_order) + 1 from public.services where category_id = p_category), 1))
  returning id into v_id;
  perform public.log_admin_action('service.create', 'service', v_id::text,
    jsonb_build_object('name', btrim(p_name), 'category', p_category));
  return v_id;
end;
$$;

revoke all on function public.admin_add_service(uuid, text, text) from public, anon;
grant execute on function public.admin_add_service(uuid, text, text) to authenticated;
