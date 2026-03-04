-- ============================================
-- SetFlow: Initial Schema
-- ============================================

-- Songs: standalone entity, reusable across setlists
create table songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  key text,
  bpm integer,
  duration integer, -- seconds
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Setlists: a named collection of songs
create table setlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Join table: songs in a setlist with ordering and per-setlist notes
create table setlist_songs (
  id uuid primary key default gen_random_uuid(),
  setlist_id uuid not null references setlists(id) on delete cascade,
  song_id uuid not null references songs(id) on delete cascade,
  position integer not null default 0,
  notes text,
  unique (setlist_id, song_id)
);

-- Practice logs: tempo tracking per song over time
create table practice_logs (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references songs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  tempo_practiced integer not null,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================
-- Indexes
-- ============================================

create index idx_songs_user on songs(user_id);
create index idx_setlists_user on setlists(user_id);
create index idx_setlist_songs_setlist on setlist_songs(setlist_id);
create index idx_setlist_songs_position on setlist_songs(setlist_id, position);
create index idx_practice_logs_song on practice_logs(song_id);
create index idx_practice_logs_user_date on practice_logs(user_id, date);

-- ============================================
-- Row Level Security
-- ============================================

alter table songs enable row level security;
alter table setlists enable row level security;
alter table setlist_songs enable row level security;
alter table practice_logs enable row level security;

-- Songs: users can only access their own
create policy "Users can view own songs"
  on songs for select using (auth.uid() = user_id);
create policy "Users can insert own songs"
  on songs for insert with check (auth.uid() = user_id);
create policy "Users can update own songs"
  on songs for update using (auth.uid() = user_id);
create policy "Users can delete own songs"
  on songs for delete using (auth.uid() = user_id);

-- Setlists: users can only access their own
create policy "Users can view own setlists"
  on setlists for select using (auth.uid() = user_id);
create policy "Users can insert own setlists"
  on setlists for insert with check (auth.uid() = user_id);
create policy "Users can update own setlists"
  on setlists for update using (auth.uid() = user_id);
create policy "Users can delete own setlists"
  on setlists for delete using (auth.uid() = user_id);

-- Setlist songs: access if user owns the setlist
create policy "Users can view own setlist songs"
  on setlist_songs for select
  using (exists (
    select 1 from setlists where setlists.id = setlist_songs.setlist_id and setlists.user_id = auth.uid()
  ));
create policy "Users can insert own setlist songs"
  on setlist_songs for insert
  with check (exists (
    select 1 from setlists where setlists.id = setlist_songs.setlist_id and setlists.user_id = auth.uid()
  ));
create policy "Users can update own setlist songs"
  on setlist_songs for update
  using (exists (
    select 1 from setlists where setlists.id = setlist_songs.setlist_id and setlists.user_id = auth.uid()
  ));
create policy "Users can delete own setlist songs"
  on setlist_songs for delete
  using (exists (
    select 1 from setlists where setlists.id = setlist_songs.setlist_id and setlists.user_id = auth.uid()
  ));

-- Practice logs: users can only access their own
create policy "Users can view own practice logs"
  on practice_logs for select using (auth.uid() = user_id);
create policy "Users can insert own practice logs"
  on practice_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own practice logs"
  on practice_logs for update using (auth.uid() = user_id);
create policy "Users can delete own practice logs"
  on practice_logs for delete using (auth.uid() = user_id);

-- ============================================
-- Auto-update updated_at timestamps
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger songs_updated_at
  before update on songs
  for each row execute function update_updated_at();

create trigger setlists_updated_at
  before update on setlists
  for each row execute function update_updated_at();
