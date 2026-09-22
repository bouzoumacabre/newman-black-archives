-- NEWMAN BLACK ARCHIVES — live R-0 operator messages
-- Lets the Game Master push player-specific hints/messages without placing them in the frontend bundle.

create table if not exists public.operator_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phase_no smallint check (phase_no is null or phase_no between 1 and 4),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  constraint operator_messages_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade
);

create index if not exists operator_messages_user_created_idx
  on public.operator_messages(user_id, created_at desc);

alter table public.operator_messages enable row level security;
revoke all on public.operator_messages from anon, authenticated;
grant select, insert on public.operator_messages to authenticated;

drop policy if exists operator_messages_select_self_or_admin on public.operator_messages;
create policy operator_messages_select_self_or_admin
on public.operator_messages for select
to authenticated
using (
  private.is_admin()
  or (
    user_id = auth.uid()
    and (
      phase_no is null
      or exists (
        select 1
        from public.player_progress pp
        where pp.user_id = auth.uid()
          and pp.phase_no = operator_messages.phase_no
      )
    )
  )
);

drop policy if exists operator_messages_insert_admin on public.operator_messages;
create policy operator_messages_insert_admin
on public.operator_messages for insert
to authenticated
with check (private.is_admin() and created_by = auth.uid());

create or replace function public.send_operator_message(
  p_user_id uuid,
  p_body text,
  p_phase_no smallint default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'ACCESS DENIED';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_user_id) then
    raise exception 'PLAYER NOT FOUND';
  end if;

  if p_phase_no is not null and (p_phase_no < 1 or p_phase_no > 4) then
    raise exception 'INVALID PHASE';
  end if;

  if p_body is null or char_length(trim(p_body)) = 0 then
    raise exception 'MESSAGE REQUIRED';
  end if;

  if char_length(p_body) > 2000 then
    raise exception 'MESSAGE TOO LONG';
  end if;

  insert into public.operator_messages(user_id, phase_no, body, created_by)
  values (p_user_id, p_phase_no, trim(p_body), auth.uid())
  returning id into v_id;

  insert into public.activity_events(user_id, event_type, label)
  values (p_user_id, 'operator_message', 'MESSAGE R-0 REÇU');

  return v_id;
end;
$$;

revoke all on function public.send_operator_message(uuid, text, smallint) from public, anon;
grant execute on function public.send_operator_message(uuid, text, smallint) to authenticated;
