-- Animee website post comments.
-- Run this file in Supabase SQL Editor after the main posts and member profiles tables exist.

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id bigint not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint post_comments_body_length check (char_length(trim(body)) between 1 and 800)
);

create index if not exists post_comments_post_created_idx
  on public.post_comments (post_id, created_at asc);

create index if not exists post_comments_author_idx
  on public.post_comments (author_id);

alter table public.post_comments enable row level security;

drop policy if exists "Website post comments are public" on public.post_comments;
create policy "Website post comments are public"
  on public.post_comments for select
  to anon, authenticated
  using (true);

drop policy if exists "Members can comment as themselves on published posts" on public.post_comments;
create policy "Members can comment as themselves on published posts"
  on public.post_comments for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.posts
      where public.posts.id = post_comments.post_id
        and public.posts.status = 'published'
    )
  );

drop policy if exists "Authors or Animee owner can delete website comments" on public.post_comments;
create policy "Authors or Animee owner can delete website comments"
  on public.post_comments for delete
  to authenticated
  using (
    auth.uid() = author_id
    or auth.uid() = '991aadfe-375e-41b1-b709-a4e0cbf74512'::uuid
  );

grant select on public.post_comments to anon, authenticated;
grant insert, delete on public.post_comments to authenticated;
