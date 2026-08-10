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
