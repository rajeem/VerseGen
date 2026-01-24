-- Function to get distinct book_ids for a version from verses
create or replace function distinct_books_for_version(p_version_id int)
returns table (book_id smallint) as $$
begin
  return query
  select distinct verses.book_id
  from verses
  where verses.version_id = p_version_id
  order by verses.book_id;
end;
$$ language plpgsql;
