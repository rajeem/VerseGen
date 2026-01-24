"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Option = { value: string; label: string }

type QueryRow = {
  versionId: string
  bookId: string
  chapter: string
  verse: string
  books: Option[]
  chapters: Option[]
  verses: Option[]
  loadingBooks: boolean
  loadingChapters: boolean
  loadingVerses: boolean
}

type Verse = { number: number; text: string }

function mockGenerate(): Verse[] {
  const baseTexts = [
    'Nang simulang likhain ng Diyos ang langit at ang lupa...',
    'At sinabi ng Diyos, “Magkaroon ng liwanag,” at nagkaroon nga ng liwanag.',
    'At nakita ng Diyos na mabuti ang liwanag.',
  ]
  return baseTexts.map((t, i) => ({ number: i + 1, text: t }))
}

type Generated = { header: string; verses: Verse[] }

export default function HomePage() {
  const [versionOptions, setVersionOptions] = useState<Option[]>([])
  const [queries, setQueries] = useState<QueryRow[]>([
    {
      versionId: '',
      bookId: '',
      chapter: '',
      verse: '',
      books: [],
      chapters: [],
      verses: [],
      loadingBooks: false,
      loadingChapters: false,
      loadingVerses: false,
    },
  ])
  const [results, setResults] = useState<Generated[] | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadVersions() {
      const { data, error } = await supabase
        .from('versions')
        .select('id, name')
        .order('id', { ascending: true })

      console.log(data)
      if (error || !data) {
        if (!isMounted) return
        setVersionOptions([])
        return
      }
      if (!isMounted) return
      setVersionOptions(
        data.map((v: any) => ({ value: String(v.id), label: String(v.name) }))
      )
    }
    loadVersions()
    return () => {
      isMounted = false
    }
  }, [])

  async function loadBooks(idx: number, versionId: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        loadingBooks: true,
        books: [],
        chapters: [],
        verses: [],
        bookId: '',
        chapter: '',
        verse: '',
      }
      return next
    })
    const { data: bookIdsData, error: bookIdsError } = await supabase
      .rpc('distinct_books_for_version', { p_version_id: Number(versionId) })
    console.log('rpc result:', { bookIdsData, bookIdsError })
    const distinctBookIds = (bookIdsData || []).map((v: any) => v.book_id)
    const { data, error } = await supabase
      .from('books')
      .select('id, name')
      .in('id', distinctBookIds)
      .order('id', { ascending: true })
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        loadingBooks: false,
        books: error || !data ? [] : data.map((b: any) => ({ value: String(b.id), label: String(b.name) })),
      }
      return next
    })
  }

  async function loadChapters(idx: number, versionId: string, bookId: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        loadingChapters: true,
        chapters: [],
        verses: [],
        chapter: '',
        verse: '',
      }
      return next
    })
    const { data, error } = await supabase
      .rpc('distinct_chapters_for_version_book', { p_version_id: Number(versionId), p_book_id: Number(bookId) })
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        loadingChapters: false,
        chapters: error || !data ? [] : data.map((c: any) => ({ value: String(c.chapter), label: String(c.chapter) })),
      }
      return next
    })
  }

  async function loadVerses(idx: number, versionId: string, bookId: string, chapter: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], loadingVerses: true, verses: [], verse: '' }
      return next
    })
    const { data, error } = await supabase
      .rpc('distinct_verses_for_version_book_chapter', {
        p_version_id: Number(versionId),
        p_book_id: Number(bookId),
        p_chapter: Number(chapter),
      })
    console.log('verses rpc result:', { data, error, versionId, bookId, chapter })
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        loadingVerses: false,
        verses: error || !data ? [] : data.map((v: any) => ({ value: String(v.verse), label: String(v.verse) })),
      }
      return next
    })
  }

  function handleVersionChange(idx: number, value: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        versionId: value,
        bookId: '',
        books: [],
        chapters: [],
        verses: [],
        chapter: '',
        verse: '',
      }
      return next
    })
    if (value) loadBooks(idx, value)
  }

  function handleBookChange(idx: number, value: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], bookId: value, chapter: '', verse: '', chapters: [], verses: [] }
      return next
    })
    const row = queries[idx]
    if (value && row.versionId) loadChapters(idx, row.versionId, value)
  }

  function handleChapterChange(idx: number, value: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], chapter: value, verse: '', verses: [] }
      return next
    })
    const row = queries[idx]
    if (value && row.versionId && row.bookId) loadVerses(idx, row.versionId, row.bookId, value)
  }

  function handleVerseChange(idx: number, value: string) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], verse: value }
      return next
    })
  }

  // Removed duplicate addMore implementation (kept the version below that also clears formError)

  function rowInvalidReason(row: QueryRow): string | null {
    if (!row.versionId) return 'Please select a version.'
    if (!row.bookId) return 'Please select a book.'
    if (!row.chapter) return 'Please select a chapter.'
    if (!row.verse) return 'Please select a verse.'
    return null
  }

  const firstInvalidReason = useMemo(
    () => queries.map(rowInvalidReason).find((r) => r) ?? null,
    [queries]
  )
  const allValid = !firstInvalidReason

  function addMore() {
    setQueries((prev) => [
      ...prev,
      {
        versionId: '',
        bookId: '',
        chapter: '',
        verse: '',
        books: [],
        chapters: [],
        verses: [],
        loadingBooks: false,
        loadingChapters: false,
        loadingVerses: false,
      },
    ])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (firstInvalidReason) return
    const groups: Generated[] = []
    for (const q of queries) {
      const { data, error } = await supabase
        .from('verses')
        .select('verse, text')
        .eq('version_id', Number(q.versionId))
        .eq('book_id', Number(q.bookId))
        .eq('chapter', Number(q.chapter))
        .eq('verse', Number(q.verse))
        .single()
      const vLabel = versionOptions.find((v) => v.value === q.versionId)?.label ?? q.versionId
      const bLabel = q.books.find((b) => b.value === q.bookId)?.label ?? q.bookId
      groups.push({
        header: `${bLabel} ${q.chapter}:${q.verse} ${vLabel}`,
        verses: error || !data ? [] : [{ number: data.verse, text: data.text }],
      })
    }
    setResults(groups)
  }

  return (
    <main className="container">
      <section className="card">
        <h1>VerseGen</h1>
        <p className="muted">Generate dummy bible verses</p>
        <form onSubmit={handleSubmit} className="rows">
          {queries.map((q, idx) => (
            <div className="row" key={idx}>
              <label className="field">
                <span className="sr-only">Version</span>
                <select
                  className="version"
                  value={q.versionId}
                  onChange={(e) => handleVersionChange(idx, e.target.value)}
                >
                  <option value="">---</option>
                  {versionOptions.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="sr-only">Book</span>
                <select
                  className="book"
                  value={q.bookId}
                  onChange={(e) => handleBookChange(idx, e.target.value)}
                  disabled={!q.versionId || q.loadingBooks}
                >
                  <option value="">---</option>
                  {q.books.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="sr-only">Chapter</span>
                <select
                  className="chapter"
                  value={q.chapter}
                  onChange={(e) => handleChapterChange(idx, e.target.value)}
                  disabled={!q.versionId || !q.bookId || q.loadingChapters}
                >
                  <option value="">---</option>
                  {q.chapters.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="sr-only">Verse</span>
                <select
                  className="verse"
                  value={q.verse}
                  onChange={(e) => handleVerseChange(idx, e.target.value)}
                  disabled={!q.versionId || !q.bookId || !q.chapter || q.loadingVerses}
                >
                  <option value="">---</option>
                  {q.verses.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}

          <div className="actions">
            <button type="button" className="secondary" onClick={addMore}>
              Add more
            </button>
            <button type="submit" disabled={!allValid}>Generate</button>
          </div>
          {firstInvalidReason && (
            <div role="alert" style={{ color: '#b91c1c', marginTop: 8, fontSize: 14 }}>
              {firstInvalidReason}
            </div>
          )}
        </form>
      </section>

      {results &&
        results.map((group, i) => (
          <section className="card" key={group.header + i}>
            <h2>{group.header}</h2>
            <ul className="verses">
              {group.verses.map((v) => (
                <li key={v.number}>
                  <strong>{v.number}</strong> {v.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </main>
  )
}
