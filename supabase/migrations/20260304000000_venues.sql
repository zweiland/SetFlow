-- Create venues table
create table venues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text,
  city text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index venues_user_id_idx on venues(user_id);

-- RLS
alter table venues enable row level security;

create policy "Users can view own venues"
  on venues for select using (auth.uid() = user_id);

create policy "Users can insert own venues"
  on venues for insert with check (auth.uid() = user_id);

create policy "Users can update own venues"
  on venues for update using (auth.uid() = user_id);

create policy "Users can delete own venues"
  on venues for delete using (auth.uid() = user_id);

-- updated_at trigger
create trigger venues_updated_at
  before update on venues
  for each row execute function update_updated_at();

-- Add venue_id to setlists
alter table setlists add column venue_id uuid references venues(id) on delete set null;

create index setlists_venue_id_idx on setlists(venue_id);
