// importance is a 1-4 integer over 3837 catalog entries, 430 tied at the top,
// so it alone left the visible top 10 decided by position in the JSON file.
import { describe, expect, it } from 'vitest'
import { byRank, topActionables } from '@/utils/rankActionables'

const act = (importance, confidence_score, title) =>
  ({ importance, confidence_score, title })

describe('byRank', () => {
  it('puts higher importance first', () => {
    expect(byRank(act(4, 0.6), act(3, 1.0))).toBeLessThan(0)
  })

  it('breaks an importance tie on confidence', () => {
    // The whole point: without this, these two keep catalog order.
    expect(byRank(act(4, 0.98), act(4, 0.95))).toBeLessThan(0)
    expect(byRank(act(4, 0.95), act(4, 0.98))).toBeGreaterThan(0)
  })

  it('never lets confidence outrank importance', () => {
    expect(byRank(act(4, 0.60), act(3, 1.0))).toBeLessThan(0)
  })

  it('sorts a missing confidence last within its band, not first', () => {
    expect(byRank(act(4, null), act(4, 0.6))).toBeGreaterThan(0)
    expect(byRank(act(4, undefined), act(4, 0.6))).toBeGreaterThan(0)
  })
})

describe('topActionables', () => {
  it('returns the ten best by importance then confidence', () => {
    // 12 entries all at importance 4 -- exactly the real catalog's shape, where
    // 430 share the top value. Only confidence can order them.
    const entries = Array.from({ length: 12 }, (_, i) =>
      act(4, 0.60 + i * 0.01, `a${i}`))

    const top = topActionables(entries)

    expect(top).toHaveLength(10)
    expect(top[0].title).toBe('a11')
    expect(top[9].title).toBe('a2')
    // The two weakest are dropped -- under the old sort they survived because
    // they came first in the array.
    expect(top.map(e => e.title)).not.toContain('a0')
    expect(top.map(e => e.title)).not.toContain('a1')
  })

  it('does not mutate the caller array', () => {
    const entries = [act(1, 0.6, 'low'), act(4, 1.0, 'high')]

    topActionables(entries)

    expect(entries[0].title).toBe('low')
  })

  it('keeps catalog order for entries equal on both keys', () => {
    const entries = [act(4, 0.9, 'first'), act(4, 0.9, 'second')]

    expect(topActionables(entries).map(e => e.title)).toEqual(['first', 'second'])
  })

  it('honours a custom limit and handles short input', () => {
    expect(topActionables([act(4, 1.0), act(3, 1.0)], 1)).toHaveLength(1)
    expect(topActionables([act(4, 1.0)])).toHaveLength(1)
  })

  it('handles an empty or malformed payload', () => {
    expect(topActionables([])).toEqual([])
    expect(topActionables(null)).toEqual([])
    expect(topActionables(undefined)).toEqual([])
    expect(topActionables([null, 'nonsense', 42])).toHaveLength(3)
  })
})
