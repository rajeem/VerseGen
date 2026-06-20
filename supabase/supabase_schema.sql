-- VerseGen schema
-- Derived from app code (app/page.tsx, lib/supabaseClient.ts) and the RPC
-- definitions in supabase_rpc_distinct_*.sql.
--
-- Column types match how the app and RPCs reference them:
--   versions.id  -> int      (rpc p_version_id int; selected/ordered by id)
--   books.id     -> smallint (rpc p_book_id smallint; verses.book_id smallint)
--   verses.*     -> version_id int, book_id smallint, chapter/verse smallint, text text
--
-- IDs are intentionally NOT identity/serial: Bible versions, books, chapters and
-- verses have fixed, well-known numbers and are imported with explicit ids.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.versions (
  id    integer     primary key,
  name  text        not null
);

create table if not exists public.books (
  id    smallint    primary key,
  name  text        not null
);

create table if not exists public.verses (
  version_id  integer   not null references public.versions (id) on delete cascade,
  book_id     smallint  not null references public.books (id)    on delete cascade,
  chapter     smallint  not null,
  verse       smallint  not null,
  text        text      not null,
  constraint verses_pkey primary key (version_id, book_id, chapter, verse),
  constraint verses_chapter_positive check (chapter >= 1),
  constraint verses_verse_positive   check (verse   >= 1)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- Support the app's cascading lookups (books -> chapters -> verses for a version)
-- and the final verse fetch filtered by version/book/chapter.
-- ---------------------------------------------------------------------------

create index if not exists verses_version_idx
  on public.verses (version_id);

create index if not exists verses_version_book_idx
  on public.verses (version_id, book_id);

create index if not exists verses_version_book_chapter_idx
  on public.verses (version_id, book_id, chapter);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The app reads with the public anon key only (no writes from the client),
-- so expose read-only access to anon + authenticated and keep writes locked
-- down to the service role / SQL editor.
-- ---------------------------------------------------------------------------

alter table public.versions enable row level security;
alter table public.books    enable row level security;
alter table public.verses   enable row level security;

drop policy if exists "Public read versions" on public.versions;
create policy "Public read versions"
  on public.versions for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read books" on public.books;
create policy "Public read books"
  on public.books for select
  to anon, authenticated
  using (true);

drop policy if exists "Public read verses" on public.verses;
create policy "Public read verses"
  on public.verses for select
  to anon, authenticated
  using (true);
