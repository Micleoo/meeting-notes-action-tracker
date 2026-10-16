create or replace function public.prevent_action_item_creator_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by_member_id is distinct from old.created_by_member_id then
    raise exception 'Action item creator cannot be changed';
  end if;
  return new;
end;
$$;

create trigger protect_action_item_creator
before update of created_by_member_id on public.action_items
for each row execute function public.prevent_action_item_creator_change();

revoke all on function public.prevent_action_item_creator_change() from public, anon, authenticated;

create or replace function public.save_meeting_with_participants(
  target_meeting uuid,
  target_workspace uuid,
  meeting_title text,
  meeting_notes text,
  meeting_scheduled_at timestamptz,
  participant_member_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_meeting uuid;
  caller_member uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select wm.id into caller_member from public.workspace_members wm
  where wm.workspace_id = target_workspace and wm.profile_id = auth.uid() and wm.left_at is null;
  if caller_member is null then raise exception 'Workspace Member required'; end if;
  if length(trim(meeting_title)) not between 1 and 240 then raise exception 'Meeting title must be 1-240 characters'; end if;
  if exists (
    select 1 from unnest(coalesce(participant_member_ids, '{}'::uuid[])) as participant(member_id)
    where not exists(select 1 from public.workspace_members wm where wm.id = member_id and wm.workspace_id = target_workspace and wm.left_at is null)
  ) then raise exception 'Every Participant must be an active Workspace Member'; end if;

  if target_meeting is not null then
    update public.meetings set title = trim(meeting_title), notes = coalesce(meeting_notes, ''), scheduled_at = meeting_scheduled_at, updated_at = now()
    where id = target_meeting and workspace_id = target_workspace returning id into saved_meeting;
    if saved_meeting is null then raise exception 'Meeting not found in Workspace'; end if;
  else
    insert into public.meetings(workspace_id, created_by_member_id, title, notes, scheduled_at)
    values(target_workspace, caller_member, trim(meeting_title), coalesce(meeting_notes, ''), meeting_scheduled_at)
    returning id into saved_meeting;
  end if;

  delete from public.meeting_participants where meeting_id = saved_meeting;
  insert into public.meeting_participants(meeting_id, member_id)
  select saved_meeting, participant.member_id from unnest(coalesce(participant_member_ids, '{}'::uuid[])) as participant(member_id);
  return saved_meeting;
end;
$$;

create or replace function public.save_action_item_with_reminders(
  target_action_item uuid,
  target_meeting uuid,
  target_owner_member uuid,
  item_title text,
  item_description text,
  item_status public.action_item_status,
  item_due_at timestamptz,
  item_completed_at timestamptz,
  reminder_schedule timestamptz[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_action uuid;
  creator_member uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(item_title)) not between 1 and 240 then raise exception 'Action item title must be 1-240 characters'; end if;
  if not exists(select 1 from public.meetings m where m.id = target_meeting and private.is_workspace_member(m.workspace_id)) then
    raise exception 'Meeting is not accessible';
  end if;
  if not exists(select 1 from public.workspace_members wm join public.meetings m on m.workspace_id = wm.workspace_id where wm.id = target_owner_member and wm.left_at is null and m.id = target_meeting) then
    raise exception 'Owner must be an active Workspace Member';
  end if;
  if exists(select 1 from unnest(coalesce(reminder_schedule, '{}'::timestamptz[])) as schedule(scheduled_for) group by scheduled_for having count(*) > 1) then
    raise exception 'Reminder schedules must be unique';
  end if;

  if target_action_item is not null then
    update public.action_items set meeting_id = target_meeting, owner_member_id = target_owner_member,
      title = trim(item_title), description = coalesce(item_description, ''), status = item_status,
      due_at = item_due_at, completed_at = item_completed_at, updated_at = now()
    where id = target_action_item returning id into saved_action;
    if saved_action is null then raise exception 'Action item not found'; end if;
  else
    select wm.id into creator_member from public.workspace_members wm join public.meetings m on m.workspace_id = wm.workspace_id
    where m.id = target_meeting and wm.profile_id = auth.uid() and wm.left_at is null;
    if creator_member is null then raise exception 'Workspace Member required'; end if;
    insert into public.action_items(meeting_id, created_by_member_id, owner_member_id, title, description, status, due_at, completed_at)
    values(target_meeting, creator_member, target_owner_member, trim(item_title), coalesce(item_description, ''), item_status, item_due_at, item_completed_at)
    returning id into saved_action;
  end if;

  update public.reminders r set cancelled_at = now(), updated_at = now()
  where r.action_item_id = saved_action and r.cancelled_at is null
    and not (r.scheduled_for = any(coalesce(reminder_schedule, '{}'::timestamptz[])));
  insert into public.reminders(action_item_id, scheduled_for, cancelled_at)
  select saved_action, schedule.scheduled_for, null
  from unnest(coalesce(reminder_schedule, '{}'::timestamptz[])) as schedule(scheduled_for)
  on conflict(action_item_id, scheduled_for) do update set cancelled_at = null, updated_at = now();
  return saved_action;
end;
$$;

revoke all on function public.save_meeting_with_participants(uuid, uuid, text, text, timestamptz, uuid[]) from public, anon;
grant execute on function public.save_meeting_with_participants(uuid, uuid, text, text, timestamptz, uuid[]) to authenticated;
revoke all on function public.save_action_item_with_reminders(uuid, uuid, uuid, text, text, public.action_item_status, timestamptz, timestamptz, timestamptz[]) from public, anon;
grant execute on function public.save_action_item_with_reminders(uuid, uuid, uuid, text, text, public.action_item_status, timestamptz, timestamptz, timestamptz[]) to authenticated;
