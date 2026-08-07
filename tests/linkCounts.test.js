// The stat cards used to sum technical-network edge weights, which count file
// changes: APEX month 1 showed 1223 commits for a month that had 46.
import { describe, expect, it } from 'vitest'
import { countEntries } from '@/utils/linkCounts'

const entry = (link, author) => ({ link, dealised_author_full_name: author })

describe('countEntries', () => {
  it('counts distinct commits and the people credited', () => {
    const rows = [
      entry('https://github.com/o/r/commit/aaa', 'Ada'),
      entry('https://github.com/o/r/commit/bbb', 'Ada'),
      entry('https://github.com/o/r/commit/ccc', 'Grace'),
    ]

    expect(countEntries(rows)).toEqual({ total: 3, people: 2 })
  })

  it('counts one commit once when two people are credited', () => {
    const rows = [
      entry('https://github.com/o/r/commit/aaa', 'Ada'),
      entry('https://github.com/o/r/commit/aaa', 'Grace'),
    ]

    expect(countEntries(rows)).toEqual({ total: 1, people: 2 })
  })

  it('does not merge records that have no link', () => {
    const rows = [entry('', 'Ada'), entry('', 'Ada')]

    expect(countEntries(rows).total).toBe(2)
  })

  it('never counts a file change more than the commit it belongs to', () => {
    // One commit touching 30 files arrives as 30 rows upstream; the link table
    // is deduplicated, so the same commit URL must still total 1.
    const rows = Array.from({ length: 30 }, () =>
      entry('https://github.com/o/r/commit/deadbeef', 'Ada'))

    expect(countEntries(rows)).toEqual({ total: 1, people: 1 })
  })

  it('handles an empty or malformed payload', () => {
    expect(countEntries([])).toEqual({ total: 0, people: 0 })
    expect(countEntries(null)).toEqual({ total: 0, people: 0 })
    expect(countEntries(undefined)).toEqual({ total: 0, people: 0 })
    expect(countEntries([null, 'nonsense', 42])).toEqual({ total: 0, people: 0 })
  })

  it('matches the real APEX month 1 shape', () => {
    // 46 distinct commits by one person -- what the card should read where it
    // previously read 1223.
    const rows = Array.from({ length: 46 }, (_, i) =>
      entry(`https://github.com/ossustain/APEX/commit/c${i}`, 'Anirudh'))

    expect(countEntries(rows)).toEqual({ total: 46, people: 1 })
  })
})
