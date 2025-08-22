-- Activities table for dashboard feed
BEGIN;

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- e.g., 'media_added', 'movie_watched', 'music_stat'
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table activities enable row level security;

-- Policy: owner can manage own activities
create policy if not exists "Owner can manage activities"
  on activities
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: anyone can SELECT activities of public profiles
-- relies on profiles.is_public = true
create policy if not exists "View public users activities"
  on activities
  for select
  using (
    exists (
      select 1 from profiles p
      where p.id = activities.user_id
      and p.is_public = true
    )
  );

COMMIT;
