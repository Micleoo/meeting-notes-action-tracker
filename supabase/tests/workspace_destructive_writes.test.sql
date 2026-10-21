begin;

select plan(18);

select ok(
  has_table_privilege('authenticated', 'public.meetings', 'select'),
  'Members can still read Meetings'
);
select ok(
  has_table_privilege('authenticated', 'public.meetings', 'update'),
  'Members can still update Meetings'
);
select ok(
  has_table_privilege('authenticated', 'public.meetings', 'insert'),
  'Members can still create Meetings'
);
select ok(
  not has_table_privilege('authenticated', 'public.meetings', 'delete'),
  'Members cannot hard-delete Meetings'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'meetings' and cmd in ('DELETE', 'ALL')
  ),
  'Meetings have no client delete policy'
);
select ok(
  not has_table_privilege('anon', 'public.meetings', 'select')
    and not has_table_privilege('anon', 'public.meetings', 'insert')
    and not has_table_privilege('anon', 'public.meetings', 'update')
    and not has_table_privilege('anon', 'public.meetings', 'delete'),
  'Unauthenticated clients have no Meeting privileges'
);

select ok(
  has_table_privilege('authenticated', 'public.reminders', 'select'),
  'Members can still read Reminders'
);
select ok(
  not has_table_privilege('authenticated', 'public.reminders', 'insert'),
  'Reminder inserts are limited to approved columns'
);
select ok(
  not has_table_privilege('authenticated', 'public.reminders', 'update'),
  'Reminder updates are limited to approved columns'
);
select ok(
  not has_table_privilege('authenticated', 'public.reminders', 'delete'),
  'Members cannot hard-delete Reminders'
);
select ok(
  has_column_privilege('authenticated', 'public.reminders', 'action_item_id', 'insert'),
  'The save RPC can link a Reminder to an Action item'
);
select ok(
  has_column_privilege('authenticated', 'public.reminders', 'scheduled_for', 'insert'),
  'The save RPC can schedule a Reminder'
);
select ok(
  has_column_privilege('authenticated', 'public.reminders', 'cancelled_at', 'insert'),
  'The save RPC can preserve cancellation state on insert'
);
select ok(
  has_column_privilege('authenticated', 'public.reminders', 'cancelled_at', 'update'),
  'The save RPC can cancel or restore a Reminder schedule'
);
select ok(
  has_column_privilege('authenticated', 'public.reminders', 'updated_at', 'update'),
  'The save RPC can update Reminder timestamps'
);
select ok(
  not has_column_privilege('authenticated', 'public.reminders', 'scheduled_for', 'update'),
  'Members cannot rewrite a Reminder schedule in place'
);
select ok(
  not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reminders' and cmd in ('DELETE', 'ALL')
  ),
  'Reminders have no client delete policy'
);
select ok(
  not has_table_privilege('anon', 'public.reminders', 'select')
    and not has_table_privilege('anon', 'public.reminders', 'insert')
    and not has_table_privilege('anon', 'public.reminders', 'update')
    and not has_table_privilege('anon', 'public.reminders', 'delete'),
  'Unauthenticated clients have no Reminder privileges'
);

select * from finish();
rollback;
