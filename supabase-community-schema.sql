-- Animee member profiles. Run in Supabase SQL Editor.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique,
 display_name text not null default '',
 bio text not null default '',
 country text not null default '',
 favorite_anime text not null default '',
 avatar_url text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Members can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Members can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create or replace function public.handle_new_animee_member() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles (id, username, display_name, country)
 values (new.id, coalesce(nullif(new.raw_user_meta_data->>'username',''), 'member_' || replace(new.id::text,'-','')),
 coalesce(nullif(new.raw_user_meta_data->>'display_name',''), nullif(new.raw_user_meta_data->>'username',''), 'Animee Member'),
 coalesce(new.raw_user_meta_data->>'country',''));
 return new;
end;
$$;
drop trigger if exists on_auth_user_created_animee_profile on auth.users;
create trigger on_auth_user_created_animee_profile after insert on auth.users for each row execute procedure public.handle_new_animee_member();
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
