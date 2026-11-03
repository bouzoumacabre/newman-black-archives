-- Staff channel (admin + managers only), staff moderation of messages.
-- audience: 'all' = every approved member, 'staff' = admin and managers only.
-- A message with a recipient is a direct message: sender, recipient and admin only.

alter table public.messages add column if not exists audience text not null default 'all' check (audience in ('all', 'staff'));

drop function if exists public.send_message(text, uuid, boolean);
create or replace function public.send_message(
  p_body text, p_recipient uuid default null, p_anonymous boolean default false, p_staff boolean default false
)
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
  if coalesce(p_staff, false) then
    if not private.is_staff() then raise exception 'ACCESS DENIED'; end if;
    if p_recipient is not null then raise exception 'INVALID TARGET'; end if;
  end if;
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

  insert into public.messages(user_id, body, recipient_id, anonymous, audience)
  values (auth.uid(), v_body, p_recipient, coalesce(p_anonymous, false), case when coalesce(p_staff, false) then 'staff' else 'all' end);
end;
$$;

drop function if exists public.chat_feed();
create or replace function public.chat_feed()
returns table (
  id uuid, body text, created_at timestamptz, sender_name text,
  recipient_id uuid, recipient_name text, is_mine boolean, anonymous boolean,
  audience text, can_delete boolean
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
    m.recipient_id, r.username, m.user_id = auth.uid(), m.anonymous, m.audience,
    private.is_admin() or (private.is_staff() and s.role <> 'admin'::public.user_role)
  from public.messages m
  join public.profiles s on s.user_id = m.user_id
  left join public.profiles r on r.user_id = m.recipient_id
  where private.is_approved()
    and (
      (m.recipient_id is null and (m.audience = 'all' or private.is_staff()))
      or m.user_id = auth.uid() or m.recipient_id = auth.uid() or private.is_admin()
    )
  order by m.created_at desc
  limit 100;
$$;

-- Staff can delete what they can see, except messages written by the admin. Admin can delete anything.
create or replace function public.delete_message(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_staff() then raise exception 'ACCESS DENIED'; end if;

  delete from public.messages m
  where m.id = p_id
    and (
      private.is_admin()
      or (
        not exists (select 1 from public.profiles s where s.user_id = m.user_id and s.role = 'admin'::public.user_role)
        and (m.recipient_id is null or m.user_id = auth.uid() or m.recipient_id = auth.uid())
      )
    );
  if not found then raise exception 'MESSAGE NOT FOUND'; end if;
end;
$$;

revoke all on function public.send_message(text, uuid, boolean, boolean) from public, anon;
revoke all on function public.chat_feed() from public, anon;
revoke all on function public.delete_message(uuid) from public, anon;
grant execute on function public.send_message(text, uuid, boolean, boolean) to authenticated;
grant execute on function public.chat_feed() to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;
