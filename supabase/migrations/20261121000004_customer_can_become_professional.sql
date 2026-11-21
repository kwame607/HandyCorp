-- A signed-in customer may switch their own account to a professional account.
-- This is the only role change a user can make. It can never produce an admin.
create or replace function public.become_professional()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  update public.profiles set role = 'professional'
    where id = auth.uid() and role = 'customer';
end;
$$;

revoke all on function public.become_professional() from public, anon;
grant execute on function public.become_professional() to authenticated;
