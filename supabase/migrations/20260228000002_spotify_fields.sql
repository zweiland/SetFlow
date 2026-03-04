-- ============================================
-- SetFlow: Spotify integration fields
-- ============================================

-- Songs: add Spotify track ID and album art URL
alter table songs add column spotify_track_id text;
alter table songs add column spotify_image_url text;

-- Spotify connections: store user OAuth tokens for playback
create table spotify_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  spotify_user_id text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  scopes text not null default '',
  display_name text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for quick lookup by user
create index idx_spotify_connections_user on spotify_connections(user_id);

-- Auto-update updated_at
create trigger set_spotify_connections_updated_at
  before update on spotify_connections
  for each row
  execute function update_updated_at();

-- RLS
alter table spotify_connections enable row level security;

create policy "Users can view own spotify connection"
  on spotify_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert own spotify connection"
  on spotify_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own spotify connection"
  on spotify_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete own spotify connection"
  on spotify_connections for delete
  using (auth.uid() = user_id);
