-- Animee Community Phase 2: text posts, comments, reactions, and sharing.
-- Run this migration in Supabase SQL Editor after the member profiles schema.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_body_length check (char_length(trim(body)) between 1 and 2000)
);
create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_author_id_idx on public.community_posts (author_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint community_comments_body_length check (char_length(trim(body)) between 1 and 800)
);
create index if not exists community_comments_post_created_idx on public.community_comments (post_id, created_at asc);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null default '❤️',
  created_at timestamptz not null default now(),
  constraint community_reactions_allowed check (reaction in ('❤️','🔥','😂','👏','😍')),
  constraint community_reactions_one_per_user unique (post_id, user_id)
);

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;

drop policy if exists "Community posts are public" on public.community_posts;
create policy "Community posts are public" on public.community_posts for select using (true);
drop policy if exists "Members can create posts" on public.community_posts;
create policy "Members can create posts" on public.community_posts for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Authors can edit own posts" on public.community_posts;
create policy "Authors can edit own posts" on public.community_posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "Authors can delete own posts" on public.community_posts;
create policy "Authors can delete own posts" on public.community_posts for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "Community comments are public" on public.community_comments;
create policy "Community comments are public" on public.community_comments for select using (true);
drop policy if exists "Members can comment as themselves" on public.community_comments;
create policy "Members can comment as themselves" on public.community_comments for insert to authenticated with check (auth.uid() = author_id);
drop policy if exists "Authors can edit own comments" on public.community_comments;
create policy "Authors can edit own comments" on public.community_comments for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists "Authors can delete own comments" on public.community_comments;
create policy "Authors can delete own comments" on public.community_comments for delete to authenticated using (auth.uid() = author_id);

drop policy if exists "Community reactions are public" on public.community_reactions;
create policy "Community reactions are public" on public.community_reactions for select using (true);
drop policy if exists "Members can react as themselves" on public.community_reactions;
create policy "Members can react as themselves" on public.community_reactions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Members can remove own reactions" on public.community_reactions;
create policy "Members can remove own reactions" on public.community_reactions for delete to authenticated using (auth.uid() = user_id);

grant select on public.community_posts, public.community_comments, public.community_reactions to anon, authenticated;
grant insert, update, delete on public.community_posts, public.community_comments to authenticated;
grant insert, delete on public.community_reactions to authenticated;
