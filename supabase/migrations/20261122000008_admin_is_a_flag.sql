-- Being an administrator is now a separate flag, not a role, so one person can be
-- an administrator AND a professional (or customer) with the same email.
alter table public.profiles add column is_admin boolean not null default false;

update public.profiles p
set is_admin = true,
    role = case when exists (select 1 from public.professional_profiles pp where pp.user_id = p.id)
                then 'professional' else 'customer' end
where p.role = 'admin';

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('customer', 'professional'));
-- No update policy exists on profiles, so nobody can set is_admin on themselves.
-- Only the project owner can, in the Supabase table editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and is_admin);
$$;

create or replace function public.admin_set_account_status(p_user uuid, p_status text, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_target_admin boolean;
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
  select role, is_admin into v_role, v_target_admin from public.profiles where id = p_user;
  if v_role is null then
    raise exception 'Unknown account' using errcode = '22023';
  end if;
  if v_target_admin or p_user = (select auth.uid()) then
    raise exception 'Administrator accounts cannot be changed here' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user;
  perform public.log_admin_action('account.' || p_status, v_role, p_user::text, jsonb_build_object('reason', v_reason));
end;
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
  where public.is_admin() and p.is_admin order by p.created_at;
$$;
