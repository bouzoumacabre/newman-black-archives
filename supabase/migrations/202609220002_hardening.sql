-- NEWMAN BLACK ARCHIVES — hardening pass
-- Keeps phase progression manual and prevents client-side edge cases.

-- A cleared phase cannot receive a new analysis, even if someone bypasses the UI.
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
    select 1
    from public.player_progress pp
    where pp.user_id = auth.uid()
      and pp.phase_no = submissions.phase_no
      and pp.completed_at is null
  )
);

-- Coordinates must contain something other than whitespace.
alter table public.transmissions
  drop constraint if exists transmissions_coordinates_nonblank;
alter table public.transmissions
  add constraint transmissions_coordinates_nonblank
  check (char_length(trim(coordinates)) between 1 and 255);

-- One successful transmission per player/phase. The GM may still keep the message
-- visible forever; future coordinates are never preloaded in the repository.
create unique index if not exists transmissions_one_per_phase
  on public.transmissions(user_id, phase_no);

-- Manual unlock stays idempotent: clicking twice must not create fake duplicate events.
create or replace function public.unlock_phase(p_user_id uuid, p_phase_no smallint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_sector text;
  v_inserted integer := 0;
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

  if p_phase_no > 1 and not exists (
    select 1
    from public.player_progress
    where user_id = p_user_id
      and phase_no = p_phase_no - 1
      and completed_at is not null
  ) then
    raise exception 'PREVIOUS PHASE NOT CLEARED';
  end if;

  insert into public.player_progress(user_id, phase_no)
  values (p_user_id, p_phase_no)
  on conflict (user_id, phase_no) do nothing;

  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    v_sector := case p_phase_no
      when 1 then 'R-0'
      when 2 then 'E-1'
      when 3 then 'C-7'
      else 'Ω'
    end;

    insert into public.activity_events(user_id, event_type, label)
    values (p_user_id, 'phase_unlocked', 'SECTEUR ' || v_sector || ' OUVERT');
  end if;
end;
$$;

revoke all on function public.unlock_phase(uuid, smallint) from public, anon;
grant execute on function public.unlock_phase(uuid, smallint) to authenticated;
