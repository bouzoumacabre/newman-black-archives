-- The admin is invisible to other members: not in profile lists, not a DM target,
-- and appears in the chat under the signature "SN" instead of the real alias.

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (
  user_id = auth.uid()
  or private.is_admin()
  or (status = 'approved'::public.account_status and role <> 'admin'::public.user_role and private.is_approved())
);

create or replace function public.send_message(p_body text, p_recipient uuid default null, p_anonymous boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
begin
  if not private.is_approved() then raise exception 'ACCESS DENIED'; end if;
  if v_body = '' then raise exception 'EMPTY MESSAGE'; end if;
  if char_length(v_body) > 1000 then raise exception 'MESSAGE TOO LONG'; end if;
  if p_recipient is not null and (
       p_recipient = auth.uid()
       or not exists (
         select 1 from public.profiles
         where user_id = p_recipient
           and status = 'approved'::public.account_status
           and (role <> 'admin'::public.user_role or private.is_admin())
       )
     ) then
    raise exception 'RECIPIENT NOT FOUND';
  end if;

  insert into public.messages(user_id, body, recipient_id, anonymous)
  values (auth.uid(), v_body, p_recipient, coalesce(p_anonymous, false));
end;
$$;

create or replace function public.chat_feed()
returns table (
  id uuid, body text, created_at timestamptz, sender_name text,
  recipient_id uuid, recipient_name text, is_mine boolean, anonymous boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.body, m.created_at,
    case
      when m.user_id = auth.uid() or private.is_admin() then s.username
      when m.anonymous then null
      when s.role = 'admin'::public.user_role then 'SN'
      else s.username
    end,
    m.recipient_id, r.username, m.user_id = auth.uid(), m.anonymous
  from public.messages m
  join public.profiles s on s.user_id = m.user_id
  left join public.profiles r on r.user_id = m.recipient_id
  where private.is_approved()
    and (m.recipient_id is null or m.user_id = auth.uid() or m.recipient_id = auth.uid() or private.is_admin())
  order by m.created_at desc
  limit 100;
$$;
