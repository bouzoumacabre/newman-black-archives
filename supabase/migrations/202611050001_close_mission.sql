-- Admin only: close an active mission directly, without waiting for the agent.
-- It counts as completed and validated.

create or replace function public.close_mission(p_mission_id uuid)
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
  set status = 'validated'::public.mission_status, completed_at = now(), validated_at = now()
  where id = p_mission_id and status = 'active'::public.mission_status
  returning * into v_row;

  if not found then
    raise exception 'MISSION NOT ACTIVE';
  end if;

  insert into public.activity_events(user_id, event_type, label)
  values (v_row.user_id, 'mission_closed', 'MISSION CLÔTURÉE — ' || upper(v_row.title));
end;
$$;

revoke all on function public.close_mission(uuid) from public, anon;
grant execute on function public.close_mission(uuid) to authenticated;
