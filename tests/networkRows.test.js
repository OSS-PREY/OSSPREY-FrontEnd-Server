// What a network month is allowed to show. Every bug these cover shipped to
// production at least once.
import { describe, expect, it } from 'vitest'
import { defaultMonth, monthRenders, renderableRows, rowsForMonth } from '@/utils/networkRows'

describe('renderableRows', () => {
  it('treats net-vis\'s empty-month sentinel as empty', () => {
    // net-vis writes [[]] for a month with no activity. parseInt(undefined) is
    // NaN, which poisoned the sum and the threshold and dropped every row.
    expect(renderableRows([[]])).toEqual([])
    expect(renderableRows(null)).toEqual([])
    expect(renderableRows([])).toEqual([])
  })

  it('keeps every real edge in a quiet month', () => {
    expect(renderableRows([['a', 'b', 3], ['c', 'd', 1]])).toHaveLength(2)
  })

  it('drops edges too thin to read once a month is busy', () => {
    expect(renderableRows([['a', 'b', 200], ['c', 'd', 1], ['e', 'f', 1]]))
      .toEqual([['a', 'b', 200]])
  })

  it('still draws a month made entirely of light edges', () => {
    // 150 edges of weight 1: the threshold is 2, so every edge was below it and
    // the card claimed the month was empty. axios month 98 had 1089 edges.
    const flat = Array.from({ length: 150 }, (_, i) => [`dev${i}`, `file${i}`, 1])
    expect(renderableRows(flat)).toHaveLength(150)
  })

  it('keeps the heaviest edges when the threshold would wipe the month', () => {
    const busy = Array.from({ length: 200 }, (_, i) => [`s${i}`, `t${i}`, (i % 9) + 1])
    const kept = renderableRows(busy)
    expect(kept.length).toBeGreaterThan(0)
    expect(kept.every(r => r[2] === 9)).toBe(true)
  })

  it('leaves a month of weightless edges empty', () => {
    expect(renderableRows([['a', 'b', 0]])).toEqual([])
  })
})

describe('rowsForMonth', () => {
  it('reads a month-keyed payload (local mode)', () => {
    expect(rowsForMonth({ 3: [['a', 'b', 1]] }, 3)).toEqual([['a', 'b', 1]])
  })

  it('passes an array straight through (foundation mode)', () => {
    expect(rowsForMonth([['a', 'b', 1]], 3)).toEqual([['a', 'b', 1]])
  })

  it('finds month 0, which is a real month for local repos', () => {
    // `month ? String(month) : ""` looked up the empty key and drew nothing.
    expect(rowsForMonth({ 0: [['a', 'b', 5]] }, 0)).toEqual([['a', 'b', 5]])
  })

  it('returns empty for a month that is not there', () => {
    expect(rowsForMonth({ 3: [] }, 9)).toEqual([])
    expect(rowsForMonth(null, 1)).toEqual([])
  })
})

describe('defaultMonth', () => {
  const tech = { 0: [['a', 'b', 5]], 1: [['a', 'b', 5]], 2: [[]] }
  const social = { 0: [['a', 'b', 5]], 1: [[]], 2: [[]] }

  it('opens on the newest month where both networks draw', () => {
    expect(defaultMonth([0, 1, 2], tech, social)).toBe(0)
  })

  it('falls back to the newest month the technical network draws', () => {
    expect(defaultMonth([0, 1, 2], tech, {})).toBe(1)
  })

  it('never opens on an empty newest month', () => {
    // The newest month is routinely empty; opening there is what made the
    // dashboard come up blank.
    expect(defaultMonth([0, 1, 2], tech, social)).not.toBe(2)
  })

  it('can choose month 0', () => {
    expect(defaultMonth([0, 1], { 0: [['a', 'b', 9]] }, { 0: [['a', 'b', 9]] })).toBe(0)
  })

  it('returns null when there are no months', () => {
    expect(defaultMonth([], tech, social)).toBeNull()
  })
})

describe('monthRenders', () => {
  it('is false for the empty-month sentinel and true for real edges', () => {
    expect(monthRenders({ 4: [[]] }, 4)).toBe(false)
    expect(monthRenders({ 4: [['a', 'b', 2]] }, 4)).toBe(true)
  })
})
