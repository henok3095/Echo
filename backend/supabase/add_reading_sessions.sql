-- Reading sessions for Books stats
create table if not exists public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid null references public.media_entries(id) on delete set null,
  date date not null,
  minutes integer not null default 0,
  pages integer null,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.reading_sessions enable row level security;
create policy if not exists "read own sessions" on public.reading_sessions
  for select using (auth.uid() = user_id);
create policy if not exists "insert own sessions" on public.reading_sessions
  for insert with check (auth.uid() = user_id);
create policy if not exists "update own sessions" on public.reading_sessions
  for update using (auth.uid() = user_id);
create policy if not exists "delete own sessions" on public.reading_sessions
  for delete using (auth.uid() = user_id);
