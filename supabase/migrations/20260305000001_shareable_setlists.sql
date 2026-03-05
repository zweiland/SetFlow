-- Add share_token column to setlists
alter table setlists add column share_token text unique;

-- RPC function to fetch a shared setlist by token (bypasses RLS)
create or replace function get_shared_setlist(token text)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'id', s.id,
    'name', s.name,
    'description', s.description,
    'venue', case when v.id is not null then json_build_object(
      'name', v.name,
      'city', v.city
    ) else null end,
    'songs', coalesce((
      select json_agg(
        json_build_object(
          'position', ss.position,
          'title', sg.title,
          'artist', sg.artist,
          'key', sg.key,
          'bpm', sg.bpm,
          'duration', sg.duration,
          'spotify_image_url', sg.spotify_image_url
        ) order by ss.position
      )
      from setlist_songs ss
      join songs sg on sg.id = ss.song_id
      where ss.setlist_id = s.id
    ), '[]'::json)
  )
  into result
  from setlists s
  left join venues v on v.id = s.venue_id
  where s.share_token = token;

  return result;
end;
$$;

-- Allow anonymous users to call this function
grant execute on function get_shared_setlist(text) to anon;
