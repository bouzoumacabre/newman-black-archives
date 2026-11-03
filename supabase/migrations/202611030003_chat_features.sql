-- Chat: direct messages, anonymous sender. Announcements: banner shown on every screen.
-- The messages table is no longer readable directly: the sender of an anonymous message
-- must never reach another client, so all reads go through public.chat_feed().

alter table public.messages add column if not exists recipient_id uuid references public.profiles(user_id) on delete cascade;
alter table public.messages add column if not exists anonymous boolean not null default false;

drop policy if exists messages_select on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_delete_admin on public.messages;
revoke all on public.messages from anon, authenticated;

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
       or not exists (select 1 from public.profiles where user_id = p_recipient and status = 'approved'::public.account_status)
     ) then
    raise exception 'RECIPIENT NOT FOUND';
  end if;

  insert into public.messages(user_id, body, recipient_id, anonymous)
  values (auth.uid(), v_body, p_recipient, coalesce(p_anonymous, false));
end;
$$;

-- Public messages for everyone; direct messages only for sender, recipient and admin.
-- sender_name is null for an anonymous message unless the viewer is its author or an admin.
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
    case when m.anonymous and m.user_id <> auth.uid() and not private.is_admin() then null else s.username end,
    m.recipient_id, r.username, m.user_id = auth.uid(), m.anonymous
  from public.messages m
  join public.profiles s on s.user_id = m.user_id
  left join public.profiles r on r.user_id = m.recipient_id
  where private.is_approved()
    and (m.recipient_id is null or m.user_id = auth.uid() or m.recipient_id = auth.uid() or private.is_admin())
  order by m.created_at desc
  limit 100;
$$;

create or replace function public.delete_message(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'ACCESS DENIED'; end if;
  delete from public.messages where id = p_id;
end;
$$;

revoke all on function public.send_message(text, uuid, boolean) from public, anon;
revoke all on function public.chat_feed() from public, anon;
revoke all on function public.delete_message(uuid) from public, anon;
grant execute on function public.send_message(text, uuid, boolean) to authenticated;
grant execute on function public.chat_feed() to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  body text not null check (char_length(btrim(body)) between 1 and 500),
  active boolean not null default true,
  created_by uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
revoke all on public.announcements from anon, authenticated;
grant select, insert, update on public.announcements to authenticated;

create policy announcements_select on public.announcements for select to authenticated
using (private.is_admin() or (private.is_approved() and active));
create policy announcements_insert_admin on public.announcements for insert to authenticated
with check (private.is_admin() and created_by = auth.uid());
create policy announcements_update_admin on public.announcements for update to authenticated
using (private.is_admin()) with check (private.is_admin());

revoke all on all tables in schema public from anon;
