-- Meeting deletion cascades into Action items; the product uses reversible Archive instead.
drop policy if exists "Members delete Meetings" on public.meetings;
revoke all on public.meetings from public, anon, authenticated;
grant select, insert, update on public.meetings to authenticated;

-- Reminder history is retained so existing Notifications keep their relationship.
-- The application creates, updates, and cancels Reminder schedules only through its RPC.
drop policy if exists "Members manage Reminders" on public.reminders;
revoke all on public.reminders from public, anon, authenticated;
grant select on public.reminders to authenticated;
create policy "Members create Reminders" on public.reminders for insert to authenticated with check (
  exists(select 1 from public.action_items ai join public.meetings m on m.id = ai.meeting_id where ai.id = public.reminders.action_item_id and private.is_workspace_member(m.workspace_id))
);
create policy "Members update Reminders" on public.reminders for update to authenticated using (
  exists(select 1 from public.action_items ai join public.meetings m on m.id = ai.meeting_id where ai.id = public.reminders.action_item_id and private.is_workspace_member(m.workspace_id))
) with check (
  exists(select 1 from public.action_items ai join public.meetings m on m.id = ai.meeting_id where ai.id = public.reminders.action_item_id and private.is_workspace_member(m.workspace_id))
);
grant insert (action_item_id, scheduled_for, cancelled_at) on public.reminders to authenticated;
grant update (cancelled_at, updated_at) on public.reminders to authenticated;
