-- Animee member profiles. Run in Supabase SQL Editor for the existing project.
-- This script is safe to re-run for the policies and triggers it owns.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null default '',
  bio text not null default '',
  country text not null default '',
  favorite_anime text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) between 3 and 40),
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9_]+$'),
  constraint profiles_bio_length check (char_length(bio) <= 280)
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "Profiles are publicly viewable" on public.profiles;
create policy "Profiles are publicly viewable"
  on public.profiles for select using (true);

drop policy if exists "Members can insert own profile" on public.profiles;
create policy "Members can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Members can update own profile" on public.profiles;
create policy "Members can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.set_animee_profile_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_animee_profile_updated_at();

create or replace function public.handle_new_animee_member()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  chosen_username text;
  chosen_display_name text;
begin
  chosen_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    'member_' || replace(new.id::text, '-', ''));
  chosen_display_name := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    chosen_username), 48);

  if char_length(chosen_username) < 3
     or char_length(chosen_username) > 40
     or chosen_username !~ '^[A-Za-z0-9_]+$' then
    chosen_username := 'member_' || replace(new.id::text, '-', '');
  end if;

  begin
    insert into public.profiles (id, username, display_name, country)
    values (new.id, chosen_username, chosen_display_name,
      left(coalesce(new.raw_user_meta_data ->> 'country', ''), 80));
  exception when unique_violation then
    -- A duplicate requested username must not prevent account creation.
    insert into public.profiles (id, username, display_name, country)
    values (new.id, 'member_' || replace(new.id::text, '-', ''),
      chosen_display_name, left(coalesce(new.raw_user_meta_data ->> 'country', ''), 80));
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_animee_profile on auth.users;
create trigger on_auth_user_created_animee_profile
after insert on auth.users for each row
execute procedure public.handle_new_animee_member();

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
