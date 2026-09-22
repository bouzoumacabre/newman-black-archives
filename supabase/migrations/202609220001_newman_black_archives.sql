-- NEWMAN BLACK ARCHIVES — initial schema
-- No treasure solution or future GPS coordinate belongs in this migration.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

do $$ begin
  create type public.user_role as enum ('player', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.submission_status as enum ('pending', 'approved', 'rejected', 'revision_requested');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role public.user_role not null default 'player',
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_.-]{3,24}$')
);

create table if not exists public.player_progress (
  user_id uuid not null,
  phase_no smallint not null check (phase_no between 1 and 4),
  unlocked_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, phase_no),
  constraint player_progress_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phase_no smallint not null check (phase_no between 1 and 4),
  answer text not null check (char_length(answer) between 80 and 10000),
  status public.submission_status not null default 'pending',
  admin_message text check (admin_message is null or char_length(admin_message) <= 2000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(user_id) on delete set null,
  constraint submissions_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade
);

create unique index if not exists pending_submission_once
  on public.submissions(user_id, phase_no)
  where status = 'pending';

create index if not exists submissions_status_created_idx on public.submissions(status, created_at desc);
create index if not exists submissions_user_created_idx on public.submissions(user_id, created_at desc);

create table if not exists public.transmissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phase_no smallint not null check (phase_no between 1 and 4),
  coordinates text not null check (char_length(coordinates) between 1 and 255),
  message text check (message is null or char_length(message) <= 2000),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(user_id) on delete restrict,
  constraint transmissions_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade
);

create index if not exists transmissions_user_created_idx on public.transmissions(user_id, created_at desc);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  label text not null check (char_length(label) between 1 and 240),
  created_at timestamptz not null default now(),
  constraint activity_events_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade
);

create index if not exists activity_events_user_created_idx on public.activity_events(user_id, created_at desc);

-- Security helper. It lives outside the exposed public schema and runs as the function owner.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'::public.user_role
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Auth trigger. The browser can propose a username, but NEVER a role.
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

  insert into public.player_progress(user_id, phase_no)
  values (new.id, 1);

  insert into public.activity_events(user_id, event_type, label)
  values
    (new.id, 'identity_created', 'IDENTITÉ FANTÔME INITIALISÉE'),
    (new.id, 'phase_unlocked', 'ACCÈS R-0 ACCORDÉ');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

create or replace function private.on_submission_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_events(user_id, event_type, label)
  values (new.user_id, 'submission_created', 'TRANSMISSION COMPILÉE');
  return new;
end;
$$;

drop trigger if exists on_submission_created on public.submissions;
create trigger on_submission_created
  after insert on public.submissions
  for each row execute procedure private.on_submission_created();

-- RLS -----------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.transmissions enable row level security;
alter table public.activity_events enable row level security;

-- Remove default broad table access. RLS remains the final gate for authenticated users.
revoke all on public.profiles from anon, authenticated;
revoke all on public.player_progress from anon, authenticated;
revoke all on public.submissions from anon, authenticated;
revoke all on public.transmissions from anon, authenticated;
revoke all on public.activity_events from anon, authenticated;

grant select on public.profiles to authenticated;
grant select, insert, update on public.player_progress to authenticated;
grant select, insert, update on public.submissions to authenticated;
grant select, insert on public.transmissions to authenticated;
grant select, insert on public.activity_events to authenticated;

-- profiles: player sees own row, admin sees all.
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
on public.profiles for select
to authenticated
using (user_id = auth.uid() or private.is_admin());

-- progress: player sees own, only admin can create/update through RPC/UI.
drop policy if exists progress_select_self_or_admin on public.player_progress;
create policy progress_select_self_or_admin
on public.player_progress for select
to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists progress_insert_admin on public.player_progress;
create policy progress_insert_admin
on public.player_progress for insert
to authenticated
with check (private.is_admin());

drop policy if exists progress_update_admin on public.player_progress;
create policy progress_update_admin
on public.player_progress for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- submissions: players can submit only for an unlocked phase and only as pending.
drop policy if exists submissions_select_self_or_admin on public.submissions;
create policy submissions_select_self_or_admin
on public.submissions for select
to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists submissions_insert_own on public.submissions;
create policy submissions_insert_own
on public.submissions for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending'::public.submission_status
  and admin_message is null
  and reviewed_at is null
  and reviewed_by is null
  and exists (
    select 1 from public.player_progress pp
    where pp.user_id = auth.uid()
      and pp.phase_no = submissions.phase_no
  )
);

drop policy if exists submissions_update_admin on public.submissions;
create policy submissions_update_admin
on public.submissions for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

-- transmissions: a player can only read their own. Only an admin can create one.
drop policy if exists transmissions_select_self_or_admin on public.transmissions;
create policy transmissions_select_self_or_admin
on public.transmissions for select
to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists transmissions_insert_admin on public.transmissions;
create policy transmissions_insert_admin
on public.transmissions for insert
to authenticated
with check (private.is_admin() and created_by = auth.uid());

-- activity: read own or admin; only admin can directly insert (system triggers are definer functions).
drop policy if exists activity_select_self_or_admin on public.activity_events;
create policy activity_select_self_or_admin
on public.activity_events for select
to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists activity_insert_admin on public.activity_events;
create policy activity_insert_admin
on public.activity_events for insert
to authenticated
with check (private.is_admin());

-- RPC: review an analysis. SECURITY INVOKER means table RLS/grants still apply.
create or replace function public.review_submission(
  p_submission_id uuid,
  p_decision public.submission_status,
  p_admin_message text default null,
  p_coordinates text default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_submission public.submissions%rowtype;
  v_label text;
begin
  if not private.is_admin() then
    raise exception 'ACCESS DENIED';
  end if;

  if p_decision not in ('approved'::public.submission_status, 'rejected'::public.submission_status, 'revision_requested'::public.submission_status) then
    raise exception 'INVALID DECISION';
  end if;

  select * into v_submission
  from public.submissions
  where id = p_submission_id
  for update;

  if not found then
    raise exception 'SUBMISSION NOT FOUND';
  end if;

  if v_submission.status <> 'pending'::public.submission_status then
    raise exception 'SUBMISSION ALREADY REVIEWED';
  end if;

  if p_admin_message is not null and char_length(p_admin_message) > 2000 then
    raise exception 'ADMIN MESSAGE TOO LONG';
  end if;

  if p_decision = 'approved'::public.submission_status then
    if p_coordinates is null or char_length(trim(p_coordinates)) = 0 then
      raise exception 'COORDINATES REQUIRED';
    end if;
    if char_length(p_coordinates) > 255 then
      raise exception 'COORDINATES TOO LONG';
    end if;
  end if;

  update public.submissions
  set status = p_decision,
      admin_message = nullif(trim(coalesce(p_admin_message, '')), ''),
      reviewed_at = now(),
      reviewed_by = auth.uid()
  where id = p_submission_id;

  if p_decision = 'approved'::public.submission_status then
    update public.player_progress
    set completed_at = coalesce(completed_at, now())
    where user_id = v_submission.user_id
      and phase_no = v_submission.phase_no;

    insert into public.transmissions(user_id, phase_no, coordinates, message, created_by)
    values (
      v_submission.user_id,
      v_submission.phase_no,
      trim(p_coordinates),
      nullif(trim(coalesce(p_admin_message, '')), ''),
      auth.uid()
    );

    v_label := 'PAQUET REÇU — PHASE ' || v_submission.phase_no::text;
    insert into public.activity_events(user_id, event_type, label)
    values
      (v_submission.user_id, 'submission_approved', 'ANALYSE ACCEPTÉE'),
      (v_submission.user_id, 'transmission_received', v_label);

  elsif p_decision = 'rejected'::public.submission_status then
    insert into public.activity_events(user_id, event_type, label)
    values (v_submission.user_id, 'submission_rejected', 'TRANSMISSION RETURNED');
  else
    insert into public.activity_events(user_id, event_type, label)
    values (v_submission.user_id, 'submission_revision', 'ADDITIONAL DATA REQUIRED');
  end if;
end;
$$;

revoke all on function public.review_submission(uuid, public.submission_status, text, text) from public, anon;
grant execute on function public.review_submission(uuid, public.submission_status, text, text) to authenticated;

-- RPC: Game Master manually opens the next sector after the in-game step is complete.
create or replace function public.unlock_phase(p_user_id uuid, p_phase_no smallint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sector text;
begin
  if not private.is_admin() then
    raise exception 'ACCESS DENIED';
  end if;

  if p_phase_no < 1 or p_phase_no > 4 then
    raise exception 'INVALID PHASE';
  end if;

  if not exists (select 1 from public.profiles where user_id = p_user_id) then
    raise exception 'PLAYER NOT FOUND';
  end if;

  -- A later phase may only be opened if the previous phase is completed.
  if p_phase_no > 1 and not exists (
    select 1 from public.player_progress
    where user_id = p_user_id
      and phase_no = p_phase_no - 1
      and completed_at is not null
  ) then
    raise exception 'PREVIOUS PHASE NOT CLEARED';
  end if;

  insert into public.player_progress(user_id, phase_no)
  values (p_user_id, p_phase_no)
  on conflict (user_id, phase_no) do nothing;

  v_sector := case p_phase_no when 1 then 'R-0' when 2 then 'E-1' when 3 then 'C-7' else 'Ω' end;
  insert into public.activity_events(user_id, event_type, label)
  values (p_user_id, 'phase_unlocked', 'SECTEUR ' || v_sector || ' OUVERT');
end;
$$;

revoke all on function public.unlock_phase(uuid, smallint) from public, anon;
grant execute on function public.unlock_phase(uuid, smallint) to authenticated;

-- No anonymous table access.
revoke all on all tables in schema public from anon;
