-- Every employee (manager) and the admin can read all missions and their order images.
-- Validating / returning / deleting stays admin-only; agents still see only their own missions.

drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions for select to authenticated
using (
  private.is_staff()
  or (private.is_approved() and (user_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists mission_orders_read on storage.objects;
create policy mission_orders_read on storage.objects for select to authenticated
using (
  bucket_id = 'mission-orders'
  and (
    private.is_staff()
    or owner_id = (select auth.uid())::text
    or exists (select 1 from public.missions m where m.image_path = storage.objects.name and (m.user_id = auth.uid() or m.created_by = auth.uid()))
  )
);
