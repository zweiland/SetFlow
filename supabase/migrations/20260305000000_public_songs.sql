-- Make songs readable by all authenticated users
drop policy "Users can view own songs" on songs;

create policy "All users can view songs"
  on songs for select using (auth.role() = 'authenticated');
