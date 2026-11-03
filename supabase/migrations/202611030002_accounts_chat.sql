-- Account approval, "manager" role (employees who can issue missions), shared chat.
-- Requires 'manager' to exist in public.user_role (added by 202611030001a_manager_role_value.sql).

do $$ begin
  create type public.account_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

alter table public.profiles add column if not exists status public.account_status not null default 'pending';
update public.profiles set status = 'approved' where status = 'pending'; -- accounts that existed before approval was introduced

create or replace function private.is_approved()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.status = 'approved'::public.account_status);
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.status = 'approved'::public.account_status
      and p.role in ('admin'::public.user_role, 'manager'::public.user_role)
  );
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'::public.user_role
      and p.status = 'approved'::public.account_status
  );
$$;

revoke all on function private.is_approved() from public;
revoke all on function private.is_staff() from public;
grant execute on function private.is_approved() to authenticated;
grant execute on function private.is_staff() to authenticated;

-- profiles: own row, admin sees all, approved members see approved members (chat / assignment).
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using (user_id = auth.uid() or private.is_admin() or (status = 'approved'::public.account_status and private.is_approved()));

-- Admin only: approve / reject an account and set agent or manager role. Admin role stays manual (SQL).
create or replace function public.review_account(
  p_user_id uuid,
  p_status public.account_status,
  p_role public.user_role default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'ACCESS DENIED'; end if;
  if p_user_id = auth.uid() then raise exception 'CANNOT EDIT SELF'; end if;
  if p_role = 'admin'::public.user_role then raise exception 'ADMIN ROLE IS MANUAL'; end if;

  update public.profiles
  set status = p_status, role = coalesce(p_role, role)
  where user_id = p_user_id and role <> 'admin'::public.user_role;
  if not found then raise exception 'PLAYER NOT FOUND'; end if;

  insert into public.activity_events(user_id, event_type, label)
  values (p_user_id, 'account_reviewed',
    case p_status when 'approved' then 'ACCÈS ACCORDÉ' when 'rejected' then 'ACCÈS REFUSÉ' else 'ACCÈS EN ATTENTE' end);
end;
$$;

revoke all on function public.review_account(uuid, public.account_status, public.user_role) from public, anon;
grant execute on function public.review_account(uuid, public.account_status, public.user_role) to authenticated;

-- missions: managers issue and follow their own missions; only admin validates / deletes.
drop policy if exists missions_select_self_or_admin on public.missions;
drop policy if exists missions_insert_admin on public.missions;
create policy missions_select on public.missions for select to authenticated
using (private.is_admin() or (private.is_approved() and (user_id = auth.uid() or created_by = auth.uid())));

create policy missions_insert_staff on public.missions for insert to authenticated
with check (
  private.is_staff() and created_by = auth.uid() and status = 'active'::public.mission_status
  and exists (select 1 from public.profiles t where t.user_id = missions.user_id and t.status = 'approved'::public.account_status)
);

create or replace function public.complete_mission(p_mission_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
begin
  if not private.is_approved() then raise exception 'ACCESS DENIED'; end if;

  update public.missions
  set status = 'awaiting_validation', completed_at = now()
  where id = p_mission_id and user_id = auth.uid() and status = 'active'
  returning title into v_title;

  if not found then raise exception 'MISSION NOT AVAILABLE'; end if;

  insert into public.activity_events(user_id, event_type, label)
  values (auth.uid(), 'mission_completed', 'MISSION DÉCLARÉE TERMINÉE — ' || upper(v_title));
end;
$$;

-- order images: assignee, issuing manager and uploader can read; staff can upload; owner can clean up.
drop policy if exists mission_orders_agent_read on storage.objects;
create policy mission_orders_read on storage.objects for select to authenticated
using (
  bucket_id = 'mission-orders'
  and (
    owner_id = (select auth.uid())::text
    or exists (select 1 from public.missions m where m.image_path = storage.objects.name and (m.user_id = auth.uid() or m.created_by = auth.uid()))
  )
);
create policy mission_orders_staff_insert on storage.objects for insert to authenticated
with check (bucket_id = 'mission-orders' and private.is_staff());
create policy mission_orders_owner_delete on storage.objects for delete to authenticated
using (bucket_id = 'mission-orders' and private.is_staff() and owner_id = (select auth.uid())::text);

-- shared chat for approved members
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_created_idx on public.messages(created_at desc);

alter table public.messages enable row level security;
revoke all on public.messages from anon, authenticated;
grant select, insert, delete on public.messages to authenticated;

create policy messages_select on public.messages for select to authenticated using (private.is_approved());
create policy messages_insert on public.messages for insert to authenticated
with check (private.is_approved() and user_id = auth.uid());
create policy messages_delete_admin on public.messages for delete to authenticated using (private.is_admin());

revoke all on all tables in schema public from anon;
