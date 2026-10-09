-- Animee Community Phase 3: private direct messages.
-- Run in Supabase SQL Editor after the member profile schema.
-- Row-level security limits message reads to sender and recipient.

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint direct_messages_not_self check (sender_id <> recipient_id),
  constraint direct_messages_body_length check (char_length(trim(body)) between 1 and 2000)
);

create index if not exists direct_messages_sender_created_idx
  on public.direct_messages (sender_id, created_at desc);
create index if not exists direct_messages_recipient_created_idx
  on public.direct_messages (recipient_id, created_at desc);

alter table public.direct_messages enable row level security;

drop policy if exists "Members can read their own direct messages" on public.direct_messages;
create policy "Members can read their own direct messages"
  on public.direct_messages for select to authenticated
  using ((select auth.uid()) = sender_id or (select auth.uid()) = recipient_id);

drop policy if exists "Members can send direct messages as themselves" on public.direct_messages;
create policy "Members can send direct messages as themselves"
  on public.direct_messages for insert to authenticated
  with check (
    (select auth.uid()) = sender_id
    and sender_id <> recipient_id
    and exists (select 1 from public.profiles p where p.id = recipient_id)
  );

drop policy if exists "Recipients can mark messages read" on public.direct_messages;
create policy "Recipients can mark messages read"
  on public.direct_messages for update to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

revoke all on table public.direct_messages from anon, authenticated;
grant select, insert on table public.direct_messages to authenticated;
grant update (read_at) on table public.direct_messages to authenticated;
