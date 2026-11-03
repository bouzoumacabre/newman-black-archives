-- NEWMAN PRIVATE NETWORK — missions. Replaces the treasure-hunt tables.
-- Flow: admin posts orders (image) -> agent ticks "terminé" -> admin validates.

drop function if exists public.review_submission(uuid, public.submission_status, text, text);
drop function if exists public.unlock_phase(uuid, smallint);
drop function if exists public.send_operator_message(uuid, smallint, text);
drop table if exists public.operator_messages, public.transmissions, public.submissions, public.player_progress cascade;
drop function if exists private.on_submission_created();
drop type if exists public.submission_status;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_username text;
begin
  v_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  if v_username !~ '^[a-z0-9_.-]{3,24}$' then
    raise exception 'INVALID GHOST ALIAS';
  end if;

  insert into public.profiles(user_id, username, role)
  values (new.id, v_username, 'player'::public.user_role);

  insert into public.activity_events(user_id, event_type, label)
  values (new.id, 'identity_created', 'IDENTITÉ ENREGISTRÉE');
  return new;
end;
$$;

do $$ begin
  create type public.mission_status as enum ('active', 'awaiting_validation', 'validated');
exception when duplicate_object then null; end $$;

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  brief text check (brief is null or char_length(brief) <= 4000),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  status public.mission_status not null default 'active',
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  completed_at timestamptz,
  validated_at timestamptz
);

create index missions_user_status_idx on public.missions(user_id, status, created_at desc);
create index missions_status_idx on public.missions(status, created_at desc);

alter table public.missions enable row level security;
revoke all on public.missions from anon, authenticated;
grant select on public.missions to authenticated;
grant insert, update, delete on public.missions to authenticated; -- gated by admin-only policies below

create policy missions_select_self_or_admin on public.missions
for select to authenticated
using (user_id = auth.uid() or private.is_admin());

create policy missions_insert_admin on public.missions
for insert to authenticated
with check (private.is_admin() and created_by = auth.uid() and status = 'active');

create policy missions_update_admin on public.missions
for update to authenticated
using (private.is_admin()) with check (private.is_admin());

create policy missions_delete_admin on public.missions
for delete to authenticated
using (private.is_admin());

create or replace function private.on_mission_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_events(user_id, event_type, label)
  values (new.user_id, 'mission_created', 'NOUVEL ORDRE REÇU — ' || upper(new.title));
  return new;
end;
$$;

create trigger on_mission_created
  after insert on public.missions
  for each row execute procedure private.on_mission_created();

-- Agent: tick "terminé". Definer so the agent never gets a general UPDATE grant.
create or replace function public.complete_mission(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  update public.missions
  set status = 'awaiting_validation', completed_at = now()
  where id = p_mission_id and user_id = auth.uid() and status = 'active'
  returning title into v_title;

  if not found then
    raise exception 'MISSION NOT AVAILABLE';
  end if;

  insert into public.activity_events(user_id, event_type, label)
  values (auth.uid(), 'mission_completed', 'MISSION DÉCLARÉE TERMINÉE — ' || upper(v_title));
end;
$$;

revoke all on function public.complete_mission(uuid) from public, anon;
grant execute on function public.complete_mission(uuid) to authenticated;

-- Admin: validate, or send back to the agent.
create or replace function public.review_mission(p_mission_id uuid, p_validate boolean)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row public.missions%rowtype;
begin
  if not private.is_admin() then
    raise exception 'ACCESS DENIED';
  end if;

  update public.missions
  set status = case when p_validate then 'validated'::public.mission_status else 'active'::public.mission_status end,
      validated_at = case when p_validate then now() else null end,
      completed_at = case when p_validate then completed_at else null end
  where id = p_mission_id and status = 'awaiting_validation'
  returning * into v_row;

  if not found then
    raise exception 'MISSION NOT AWAITING VALIDATION';
  end if;

  insert into public.activity_events(user_id, event_type, label)
  values (v_row.user_id, 'mission_reviewed',
    case when p_validate then 'MISSION VALIDÉE — ' else 'MISSION RENVOYÉE — ' end || upper(v_row.title));
end;
$$;

revoke all on function public.review_mission(uuid, boolean) from public, anon;
grant execute on function public.review_mission(uuid, boolean) to authenticated;

-- Private bucket for the order images (signed URLs only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mission-orders', 'mission-orders', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

create policy mission_orders_admin_write on storage.objects
for all to authenticated
using (bucket_id = 'mission-orders' and private.is_admin())
with check (bucket_id = 'mission-orders' and private.is_admin());

create policy mission_orders_agent_read on storage.objects
for select to authenticated
using (
  bucket_id = 'mission-orders'
  and exists (select 1 from public.missions m where m.image_path = storage.objects.name and m.user_id = auth.uid())
);

revoke all on all tables in schema public from anon;
