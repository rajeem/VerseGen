"use client"

import React, { useState } from 'react'

const versions = [
  { value: 'MB', label: 'MB' },
  { value: 'KJV', label: 'KJV' },
  { value: 'NIV', label: 'NIV' },
  { value: 'ESV', label: 'ESV' },
]

const books = [
  'Genesis',
  'Exodus',
  'Psalms',
  'Proverbs',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  'Revelation',
]

type FormState = {
  version: string
  book: string
  chapter: number
  verse: number
}

type Verse = { number: number; text: string }

function mockGenerate({ book, chapter, verse, version }: FormState): Verse[] {
  const baseTexts = [
    'Nang simulang likhain ng Diyos ang langit at ang lupa...',
    'At sinabi ng Diyos, “Magkaroon ng liwanag,” at nagkaroon nga ng liwanag.',
    'At nakita ng Diyos na mabuti ang liwanag.',
  ]
  return baseTexts.map((t, i) => ({ number: verse + i, text: t }))
}

type Generated = { header: string; verses: Verse[] }

export default function HomePage() {
  const [queries, setQueries] = useState<FormState[]>([
    { version: versions[0].value, book: books[0], chapter: 1, verse: 1 },
  ])
  const [results, setResults] = useState<Generated[] | null>(null)

  function handleChange<T extends keyof FormState>(
    idx: number,
    key: T,
    value: FormState[T]
  ) {
    setQueries((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [key]: value }
      return next
    })
  }

  function addMore() {
    setQueries((prev) => [
      ...prev,
      { version: versions[0].value, book: books[0], chapter: 1, verse: 1 },
    ])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const groups: Generated[] = queries.map((q) => ({
      header: `${q.book} ${q.chapter}:${q.verse} ${q.version}`,
      verses: mockGenerate(q),
    }))
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
                  value={q.version}
                  onChange={(e) => handleChange(idx, 'version', e.target.value)}
                >
                  {versions.map((v) => (
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
                  value={q.book}
                  onChange={(e) => handleChange(idx, 'book', e.target.value)}
                >
                  {books.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="sr-only">Chapter</span>
                <input
                  className="chapter"
                  type="number"
                  min={1}
                  value={q.chapter}
                  onChange={(e) =>
                    handleChange(idx, 'chapter', Number(e.target.value) || 1)
                  }
                />
              </label>

              <label className="field">
                <span className="sr-only">Verse</span>
                <input
                  className="verse"
                  type="number"
                  min={1}
                  value={q.verse}
                  onChange={(e) =>
                    handleChange(idx, 'verse', Number(e.target.value) || 1)
                  }
                />
              </label>
            </div>
          ))}

          <div className="actions">
            <button type="button" className="secondary" onClick={addMore}>
              Add more
            </button>
            <button type="submit">Generate</button>
          </div>
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
