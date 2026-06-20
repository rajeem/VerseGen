-- Function to get distinct verses for a version+book+chapter from verses
create or replace function distinct_verses_for_version_book_chapter(p_version_id int, p_book_id smallint, p_chapter smallint)
returns table (verse smallint) as $$
begin
  return query
  select distinct verses.verse
  from verses
  where verses.version_id = p_version_id and verses.book_id = p_book_id and verses.chapter = p_chapter
  order by verses.verse;
end;
$$ language plpgsql;
