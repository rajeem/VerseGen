-- Function to get distinct chapters for a version+book from verses
create or replace function distinct_chapters_for_version_book(p_version_id int, p_book_id smallint)
returns table (chapter smallint) as $$
begin
  return query
  select distinct verses.chapter
  from verses
  where verses.version_id = p_version_id and verses.book_id = p_book_id
  order by verses.chapter;
end;
$$ language plpgsql;
