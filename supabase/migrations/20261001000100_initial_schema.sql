create schema if not exists private;
revoke all on schema private from public;

create type public.workspace_role as enum ('owner', 'member');
create type public.action_item_status as enum ('not_started', 'in_progress', 'completed');
create type public.invitation_status as enum ('pending', 'accepted', 'cancelled', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', avatar_url text, time_zone text not null default 'UTC',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workspaces (
  id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade, role public.workspace_role not null default 'member',
  email_reminders_enabled boolean not null default true, joined_at timestamptz not null default now(), left_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(workspace_id, profile_id)
);
create index workspace_members_profile_active on public.workspace_members(profile_id) where left_at is null;
create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_by_member_id uuid not null references public.workspace_members(id), invitee_email text not null,
  token uuid not null unique default gen_random_uuid(), status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '7 days'), accepted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.meetings (
  id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by_member_id uuid not null references public.workspace_members(id), title text not null check(length(trim(title)) between 1 and 240),
  notes text not null default '', scheduled_at timestamptz not null, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index meetings_workspace_date on public.meetings(workspace_id, scheduled_at desc);
create table public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  member_id uuid not null references public.workspace_members(id), created_at timestamptz not null default now(), primary key(meeting_id, member_id)
);
create table public.action_items (
  id uuid primary key default gen_random_uuid(), meeting_id uuid not null references public.meetings(id) on delete cascade,
  created_by_member_id uuid not null references public.workspace_members(id), owner_member_id uuid not null references public.workspace_members(id),
  title text not null check(length(trim(title)) between 1 and 240), description text not null default '',
  status public.action_item_status not null default 'not_started', due_at timestamptz, completed_at timestamptz, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index action_items_meeting on public.action_items(meeting_id, created_at desc);
create index action_items_owner on public.action_items(owner_member_id, status) where archived_at is null;
create table public.reminders (
  id uuid primary key default gen_random_uuid(), action_item_id uuid not null references public.action_items(id) on delete cascade,
  scheduled_for timestamptz not null, cancelled_at timestamptz, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique(action_item_id, scheduled_for)
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_member_id uuid not null references public.workspace_members(id) on delete cascade,
  reminder_id uuid references public.reminders(id) on delete cascade, channel text not null default 'in_app' check(channel = 'in_app'),
  title text not null, body text not null default '', sent_at timestamptz, read_at timestamptz,
  created_at timestamptz not null default now(), unique(reminder_id, recipient_member_id, channel)
);

create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members wm where wm.workspace_id = target_workspace and wm.profile_id = (select auth.uid()) and wm.left_at is null);
$$;
create or replace function private.is_workspace_owner(target_workspace uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.workspace_members wm where wm.workspace_id = target_workspace and wm.profile_id = (select auth.uid()) and wm.left_at is null and wm.role = 'owner');
$$;
revoke all on function private.is_workspace_member(uuid), private.is_workspace_owner(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid), private.is_workspace_owner(uuid) to authenticated;

create or replace function public.create_workspace(workspace_name text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_workspace_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(workspace_name)) not between 1 and 120 then raise exception 'Workspace name must be 1-120 characters'; end if;
  insert into public.profiles(id, full_name) values (auth.uid(), coalesce(auth.jwt()->>'name', split_part(coalesce(auth.jwt()->>'email',''), '@', 1), '')) on conflict(id) do nothing;
  insert into public.workspaces(name) values(trim(workspace_name)) returning id into new_workspace_id;
  insert into public.workspace_members(workspace_id, profile_id, role) values(new_workspace_id, auth.uid(), 'owner');
  return new_workspace_id;
end; $$;
revoke all on function public.create_workspace(text) from public, anon;
grant execute on function public.create_workspace(text) to authenticated;

create or replace function public.accept_workspace_invitation(invitation_token uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.workspace_invitations%rowtype; new_member_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into invitation from public.workspace_invitations wi where wi.token = invitation_token and wi.status = 'pending' and wi.expires_at > now() for update;
  if not found then raise exception 'Invitation is invalid or expired'; end if;
  if lower(invitation.invitee_email) <> lower(coalesce(auth.jwt()->>'email','')) then raise exception 'Signed-in email does not match invitation'; end if;
  if exists(select 1 from public.workspace_members where workspace_id = invitation.workspace_id and profile_id = auth.uid() and left_at is null) then raise exception 'You are already an active Member of this Workspace'; end if;
  insert into public.profiles(id, full_name) values(auth.uid(), coalesce(auth.jwt()->>'name', split_part(coalesce(auth.jwt()->>'email',''), '@', 1), '')) on conflict(id) do nothing;
  insert into public.workspace_members(workspace_id, profile_id, role) values(invitation.workspace_id, auth.uid(), 'member')
  on conflict(workspace_id, profile_id) do update set role = 'member', left_at = null, joined_at = now(), updated_at = now() returning id into new_member_id;
  update public.workspace_invitations set status = 'accepted', accepted_at = now(), updated_at = now() where id = invitation.id;
  return new_member_id;
end; $$;
revoke all on function public.accept_workspace_invitation(uuid) from public, anon;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;

create or replace function public.remove_workspace_member(target_workspace uuid, target_member uuid, reassignments jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.workspace_members%rowtype; owners_left integer; work record; next_owner uuid;
begin
  if not private.is_workspace_owner(target_workspace) then raise exception 'Workspace Owner required'; end if;
  perform 1 from public.workspaces where id = target_workspace for update;
  if not private.is_workspace_owner(target_workspace) then raise exception 'Workspace Owner required'; end if;
  select * into target from public.workspace_members where id = target_member and workspace_id = target_workspace and left_at is null for update;
  if not found then raise exception 'Active Member not found'; end if;
  if target.profile_id = auth.uid() then raise exception 'Cannot remove yourself; transfer ownership first'; end if;
  if target.role = 'owner' then
    select count(*) into owners_left from public.workspace_members where workspace_id = target_workspace and left_at is null and role = 'owner' and id <> target_member;
    if owners_left = 0 then raise exception 'Workspace must retain at least one Owner'; end if;
  end if;
  for work in select ai.id from public.action_items ai join public.meetings m on m.id = ai.meeting_id
    where ai.owner_member_id = target_member and ai.status <> 'completed' and ai.archived_at is null and m.workspace_id = target_workspace
  loop
    next_owner := null;
    begin next_owner := (reassignments->>work.id::text)::uuid; exception when others then next_owner := null; end;
    if next_owner is null or not exists(select 1 from public.workspace_members where id = next_owner and workspace_id = target_workspace and left_at is null and id <> target_member) then
      raise exception 'Reassign every active Action item before removing this Member';
    end if;
    update public.action_items set owner_member_id = next_owner, updated_at = now() where id = work.id;
  end loop;
  update public.workspace_members set left_at = now(), updated_at = now() where id = target_member;
end; $$;
revoke all on function public.remove_workspace_member(uuid, uuid, jsonb) from public, anon;
grant execute on function public.remove_workspace_member(uuid, uuid, jsonb) to authenticated;

create or replace function public.set_workspace_member_role(target_workspace uuid, target_member uuid, new_role public.workspace_role)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.workspace_members%rowtype; owners_count integer;
begin
  if not private.is_workspace_owner(target_workspace) then raise exception 'Workspace Owner required'; end if;
  perform 1 from public.workspaces where id = target_workspace for update;
  if not private.is_workspace_owner(target_workspace) then raise exception 'Workspace Owner required'; end if;
  select * into target from public.workspace_members where id = target_member and workspace_id = target_workspace and left_at is null for update;
  if not found then raise exception 'Active Member not found'; end if;
  if target.role = 'owner' and new_role = 'member' then
    select count(*) into owners_count from public.workspace_members where workspace_id = target_workspace and left_at is null and role = 'owner';
    if owners_count < 2 then raise exception 'Workspace must retain at least one Owner'; end if;
  end if;
  update public.workspace_members set role = new_role, updated_at = now() where id = target_member;
end; $$;
revoke all on function public.set_workspace_member_role(uuid, uuid, public.workspace_role) from public, anon;
grant execute on function public.set_workspace_member_role(uuid, uuid, public.workspace_role) to authenticated;

create or replace function public.update_email_reminders(target_member uuid, enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.workspace_members set email_reminders_enabled = enabled, updated_at = now() where id = target_member and profile_id = auth.uid() and left_at is null;
  if not found then raise exception 'Active Member not found'; end if;
end; $$;
revoke all on function public.update_email_reminders(uuid, boolean) from public, anon;
grant execute on function public.update_email_reminders(uuid, boolean) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, avatar_url)
  values(new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1), ''), new.raw_user_meta_data->>'avatar_url')
  on conflict(id) do update set full_name = excluded.full_name, avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url), updated_at = now();
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_auth_user();
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.set_updated_at() from public, anon, authenticated;
do $$ declare table_name text; begin
  foreach table_name in array array['profiles','workspaces','workspace_members','workspace_invitations','meetings','action_items','reminders'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
  end loop;
end; $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_participants enable row level security;
alter table public.action_items enable row level security;
alter table public.reminders enable row level security;
alter table public.notifications enable row level security;

create policy "profiles readable by workspace Members" on public.profiles for select to authenticated using (
  id = (select auth.uid()) or exists(select 1 from public.workspace_members mine join public.workspace_members other on other.workspace_id = mine.workspace_id
  where mine.profile_id = (select auth.uid()) and mine.left_at is null and other.profile_id = profiles.id and other.left_at is null)
);
create policy "Member updates own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Members read their Workspaces" on public.workspaces for select to authenticated using (private.is_workspace_member(id));
create policy "Owners update Workspaces" on public.workspaces for update to authenticated using (private.is_workspace_owner(id)) with check (private.is_workspace_owner(id));
create policy "Members read Workspace membership" on public.workspace_members for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Owners read invitations" on public.workspace_invitations for select to authenticated using (private.is_workspace_owner(workspace_id));
create policy "Owners update invitations" on public.workspace_invitations for update to authenticated using (private.is_workspace_owner(workspace_id)) with check (private.is_workspace_owner(workspace_id));
create policy "Members read Meetings" on public.meetings for select to authenticated using (private.is_workspace_member(workspace_id));
create policy "Members create Meetings" on public.meetings for insert to authenticated with check (private.is_workspace_member(workspace_id) and exists(select 1 from public.workspace_members wm where wm.id = created_by_member_id and wm.workspace_id = workspace_id and wm.profile_id = (select auth.uid()) and wm.left_at is null));
create policy "Members update Meetings" on public.meetings for update to authenticated using (private.is_workspace_member(workspace_id)) with check (private.is_workspace_member(workspace_id));
create policy "Members delete Meetings" on public.meetings for delete to authenticated using (private.is_workspace_member(workspace_id));
create policy "Members read Meeting Participants" on public.meeting_participants for select to authenticated using (exists(select 1 from public.meetings m where m.id = meeting_id and private.is_workspace_member(m.workspace_id)));
create policy "Members manage Meeting Participants" on public.meeting_participants for all to authenticated using (exists(select 1 from public.meetings m where m.id = meeting_id and private.is_workspace_member(m.workspace_id))) with check (
  exists(select 1 from public.meetings m join public.workspace_members wm on wm.workspace_id = m.workspace_id where m.id = meeting_id and private.is_workspace_member(m.workspace_id) and wm.id = member_id and wm.left_at is null)
);
create policy "Members read Action items" on public.action_items for select to authenticated using (exists(select 1 from public.meetings m where m.id = meeting_id and private.is_workspace_member(m.workspace_id)));
create policy "Members create Action items" on public.action_items for insert to authenticated with check (exists(
  select 1 from public.meetings m join public.workspace_members c on c.id = created_by_member_id and c.workspace_id = m.workspace_id
  join public.workspace_members o on o.id = owner_member_id and o.workspace_id = m.workspace_id
  where m.id = meeting_id and private.is_workspace_member(m.workspace_id) and c.profile_id = (select auth.uid()) and c.left_at is null and o.left_at is null
));
create policy "Members update Action items" on public.action_items for update to authenticated using (exists(select 1 from public.meetings m where m.id = meeting_id and private.is_workspace_member(m.workspace_id))) with check (
  exists(select 1 from public.meetings m join public.workspace_members o on o.id = owner_member_id and o.workspace_id = m.workspace_id where m.id = meeting_id and private.is_workspace_member(m.workspace_id) and o.left_at is null)
);
create policy "Creators delete Action items" on public.action_items for delete to authenticated using (exists(select 1 from public.meetings m join public.workspace_members c on c.id = created_by_member_id where m.id = meeting_id and private.is_workspace_member(m.workspace_id) and c.profile_id = (select auth.uid())));
create policy "Members read Reminders" on public.reminders for select to authenticated using (exists(select 1 from public.action_items ai join public.meetings m on m.id = ai.meeting_id where ai.id = action_item_id and private.is_workspace_member(m.workspace_id)));
create policy "Members manage Reminders" on public.reminders for all to authenticated using (exists(select 1 from public.action_items ai join public.meetings m on m.id = ai.meeting_id where ai.id = action_item_id and private.is_workspace_member(m.workspace_id))) with check (
  exists(select 1 from public.action_items ai join public.meetings m on m.id = ai.meeting_id where ai.id = action_item_id and private.is_workspace_member(m.workspace_id))
);
create policy "Members read their Notifications" on public.notifications for select to authenticated using (exists(select 1 from public.workspace_members wm where wm.id = recipient_member_id and wm.profile_id = (select auth.uid()) and wm.left_at is null));
create policy "Members mark their Notifications read" on public.notifications for update to authenticated using (exists(select 1 from public.workspace_members wm where wm.id = recipient_member_id and wm.profile_id = (select auth.uid()) and wm.left_at is null)) with check (
  exists(select 1 from public.workspace_members wm where wm.id = recipient_member_id and wm.profile_id = (select auth.uid()) and wm.left_at is null)
);

revoke all on public.profiles, public.workspaces, public.workspace_members, public.workspace_invitations,
  public.meetings, public.meeting_participants, public.action_items, public.reminders, public.notifications
  from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, update on public.workspace_invitations to authenticated;
grant select, insert, update, delete on public.meetings, public.meeting_participants, public.action_items, public.reminders to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
