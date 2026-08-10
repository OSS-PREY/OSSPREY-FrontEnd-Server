// The digest is the only place the socio-technical numbers are computed --
// RepoWise holds none of them -- so if it is wrong the analysis is confidently
// wrong, which is worse than empty.
import { describe, expect, it } from 'vitest'
import { buildDigest } from '@/utils/painPointsDigest'

// [developer, file, changes] and [sender, receiver, messages].
const TECH = {
  0: [['ann', 'a.py', '5'], ['bob', 'b.py', '5']],
  1: [['ann', 'a.py', '30'], ['ann', 'c.py', '10'], ['bob', 'b.py', '10']],
}
const SOCIAL = {
  0: [['ann', 'bob', '4'], ['bob', 'ann', '4']],
  1: [['ann', 'bob', '9'], ['bob', 'ann', '1']],
}

const digestFor = (extra = {}) => buildDigest({
  forecast: [0.6, 0.4],
  months: [0, 1],
  techNetData: TECH,
  socialNetData: SOCIAL,
  selectedMonth: 1,
  ...extra,
})

describe('buildDigest shape', () => {
  it('returns null when there is nothing to analyse', () => {
    expect(buildDigest({})).toBeNull()
    expect(buildDigest()).toBeNull()
  })

  it('carries the month the dashboard is showing', () => {
    expect(digestFor().month).toBe(1)
  })

  it('reports the forecast and its latest value', () => {
    const { forecast } = digestFor()

    expect(forecast.latest).toBe(0.4)
    expect(forecast.series).toEqual([{ month: 0, value: 0.6 }, { month: 1, value: 0.4 }])
  })

  it('works from a forecast alone', () => {
    // Apache projects can arrive before their networks do.
    const digest = buildDigest({ forecast: [0.5], months: [0], selectedMonth: 0 })

    expect(digest.forecast.latest).toBe(0.5)
    expect(digest.technical).toBeUndefined()
  })
})

describe('buildDigest technical signals', () => {
  it('trends developers and files across months', () => {
    const { series } = digestFor().technical

    expect(series.developers).toEqual([{ month: 0, value: 2 }, { month: 1, value: 2 }])
    expect(series.files.at(-1).value).toBe(3)
    expect(series.changes.at(-1).value).toBe(50)
  })

  it('measures the bus factor as a share of the work, not a headcount', () => {
    // ann does 40 of 50 changes: two developers, one of them load-bearing.
    const { technical } = digestFor()

    expect(technical.top_contributor_share).toBeCloseTo(0.8)
    expect(technical.top_two_share).toBeCloseTo(1)
  })

  it('counts files only one person touched', () => {
    expect(digestFor().technical.solo_files).toEqual({ count: 3, total: 3 })
  })

  it('does not count a file as siloed when two people touch it', () => {
    const shared = { 1: [['ann', 'a.py', '1'], ['bob', 'a.py', '1']] }
    const digest = buildDigest({ techNetData: shared, selectedMonth: 1, forecast: [] })

    expect(digest.technical.solo_files).toEqual({ count: 0, total: 1 })
  })
})

describe('buildDigest social signals', () => {
  it('counts participants on both ends of a conversation', () => {
    expect(digestFor().social.series.participants.at(-1).value).toBe(2)
  })

  it('flags developers who commit but never talk', () => {
    const digest = buildDigest({
      techNetData: { 1: [['ann', 'a.py', '1'], ['carol', 'c.py', '1']] },
      socialNetData: { 1: [['ann', 'bob', '2']] },
      selectedMonth: 1,
      forecast: [],
    })

    // carol shipped code and said nothing; ann did both.
    expect(digest.social.silent_developers).toEqual({ count: 1, total: 2 })
  })

  it('marks a month with no discussion at all', () => {
    const digest = buildDigest({
      techNetData: { 1: [['ann', 'a.py', '1']] },
      socialNetData: { 1: [] },
      selectedMonth: 1,
      forecast: [],
    })

    expect(digest.social.empty).toBe(true)
  })
})

describe('buildDigest robustness', () => {
  it('ignores malformed rows rather than poisoning the sums', () => {
    // net-vis writes a bare [] for an empty month, and parseInt(undefined) is
    // NaN, which used to propagate through every total.
    const messy = { 1: [[], ['ann'], ['ann', 'a.py', 'x'], ['ann', 'a.py', '4']] }
    const digest = buildDigest({ techNetData: messy, selectedMonth: 1, forecast: [] })

    expect(digest.technical.series.changes.at(-1).value).toBe(4)
    expect(digest.technical.top_contributor_share).toBe(1)
  })

  it('handles a foundation-mode network, which is one month as a bare array', () => {
    const digest = buildDigest({
      techNetData: [['ann', 'a.py', '3']],
      socialNetData: [['ann', 'bob', '1']],
      selectedMonth: 4,
      forecast: [0.5],
      months: [4],
    })

    expect(digest.technical.top_contributor_share).toBe(1)
    expect(digest.technical.series.developers).toEqual([])
  })

  it('caps the trend window so the payload stays small', () => {
    const many = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [i, [['ann', 'a.py', '1']]]))
    const digest = buildDigest({ techNetData: many, selectedMonth: 39, forecast: [] })

    expect(digest.technical.series.developers).toHaveLength(6)
  })

  it('returns no share for a month with no weight to divide', () => {
    const digest = buildDigest({
      techNetData: { 1: [['ann', 'a.py', '0']] }, selectedMonth: 1, forecast: [],
    })

    expect(digest.technical.top_contributor_share).toBeNull()
  })
})

// The trend used to be sliced from the project's END regardless of which month
// was selected. On a 270-month project, viewing month 5 was described by months
// 264-270 -- and the analysis then cited those figures as if they were month
// 5's, which is wrong rather than merely stale.
describe('buildDigest windows the trend at the selected month', () => {
  // Ten months of activity, growing then collapsing.
  const TECH = Object.fromEntries(
    Array.from({ length: 10 }, (_, m) => [m, [['ann', `f${m}.py`, String(m < 5 ? 2 : 20)]]]))
  const FORECAST = [0.9, 0.9, 0.9, 0.9, 0.9, 0.2, 0.2, 0.2, 0.2, 0.2]
  const MONTHS = Array.from({ length: 10 }, (_, i) => i)

  const at = month => buildDigest({
    forecast: FORECAST, months: MONTHS, techNetData: TECH, selectedMonth: month,
  })

  it('never reports a month later than the one selected', () => {
    const series = at(3).technical.series.changes

    expect(series.map(p => p.month)).toEqual([0, 1, 2, 3])
    expect(Math.max(...series.map(p => p.month))).toBeLessThanOrEqual(3)
  })

  it('gives different months different evidence', () => {
    // This is what makes a per-month recompute worth its inference cost.
    expect(at(3).technical.series.changes).not.toEqual(at(9).technical.series.changes)
  })

  it('reports the selected month forecast, not the project final one', () => {
    expect(at(3).forecast.latest).toBe(0.9)
    expect(at(9).forecast.latest).toBe(0.2)
  })

  it('still caps the window at six months', () => {
    expect(at(9).technical.series.changes).toHaveLength(6)
    expect(at(9).technical.series.changes[0].month).toBe(4)
  })

  it('reports no trend for a month before any activity', () => {
    // Honest: there is no history up to it. Better than showing later months.
    // A forecast point is needed or buildDigest returns null outright -- with
    // no forecast and nothing in the selected month there is nothing to analyse.
    const digest = buildDigest({
      forecast: [0.5], months: [0], techNetData: { 5: [['ann', 'a.py', '1']] },
      selectedMonth: 1,
    })

    expect(digest.technical.series.changes).toEqual([])
  })

  it('falls back to the whole tail when no month is selected', () => {
    const digest = buildDigest({ forecast: FORECAST, months: MONTHS, techNetData: TECH })

    expect(digest.technical.series.changes.at(-1).month).toBe(9)
  })
})

// Pain points ask what is wrong with the PROJECT, so they get its whole
// history: every month of trend, and the point-in-time measures aggregated
// over all of it rather than taken from whichever month the slider opened on.
describe('buildDigest lifetime span', () => {
  const TECH = {
    0: [['ann', 'a.py', '10']],
    1: [['ann', 'b.py', '10']],
    2: [['ann', 'c.py', '10'], ['bob', 'd.py', '10']],
    9: [['bob', 'e.py', '10']],
  }
  const MONTHS = [0, 1, 2, 9]

  const all = () => buildDigest({
    forecast: [0.9, 0.8, 0.7, 0.2], months: MONTHS, techNetData: TECH,
    socialNetData: { 2: [['ann', 'bob', '3']] }, selectedMonth: 2, span: 'all',
  })

  it('covers every month, not the six ending at the slider', () => {
    expect(all().technical.series.developers.map(p => p.month)).toEqual(MONTHS)
    expect(all().forecast.series).toHaveLength(4)
  })

  it('ignores the selected month entirely', () => {
    const atTwo = buildDigest({ forecast: [0.9, 0.8, 0.7, 0.2], months: MONTHS,
      techNetData: TECH, selectedMonth: 2, span: 'all' })
    const atNine = buildDigest({ forecast: [0.9, 0.8, 0.7, 0.2], months: MONTHS,
      techNetData: TECH, selectedMonth: 9, span: 'all' })

    // Same project, same answer, wherever the slider sits.
    expect(atTwo.technical).toEqual(atNine.technical)
    expect(atTwo.forecast).toEqual(atNine.forecast)
  })

  it('measures the bus factor over the whole project, not one month', () => {
    // ann did 30 of 50 changes across the project; in month 2 alone she did half.
    expect(all().technical.top_contributor_share).toBeCloseTo(0.6)
  })

  it('counts a file as shared when different people touched it in different months', () => {
    const shared = { 0: [['ann', 'x.py', '1']], 5: [['bob', 'x.py', '1']] }
    const digest = buildDigest({ forecast: [0.5], months: [0, 5],
      techNetData: shared, selectedMonth: 5, span: 'all' })

    // One file, two developers across time -- not a silo.
    expect(digest.technical.solo_files).toEqual({ count: 0, total: 1 })
  })

  it('reports the span so the analysis does not read it as one month', () => {
    expect(all().span).toBe('all')
    expect(all().months_covered).toBe(4)
  })

  it('leaves the windowed default untouched for the actionables panel', () => {
    const windowed = buildDigest({ forecast: [0.9, 0.8, 0.7, 0.2], months: MONTHS,
      techNetData: TECH, selectedMonth: 2 })

    expect(windowed.span).toBe('window')
    expect(windowed.technical.series.developers.map(p => p.month)).toEqual([0, 1, 2])
  })
})
