// gem5's real cached pipeline output: the last four months carry a placeholder
// row and zero developers while the social side carries on, so the forecaster
// returns ~0 and the raw series ends 0.994, 0.0096, 0.005, 0.0001.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildDigest } from '@/utils/painPointsDigest'

const FORECAST = JSON.parse(readFileSync('/mnt/data1/OSSPREY/OSSPREY-Pex-Forecaster/forecasts/gem5.json', 'utf8'))
const NET = JSON.parse(readFileSync('/mnt/data1/OSSPREY/OSSPREY-Pex-Forecaster/net-vis/gem5.json', 'utf8'))

const months = Object.keys(FORECAST).map(Number).sort((a, b) => a - b)
const digest = buildDigest({
  forecast: months.map(m => FORECAST[String(m)]),
  months,
  techNetData: NET.tech,
  socialNetData: NET.social,
  selectedMonth: 274,
  span: 'all',
})

describe('gem5 lifetime digest', () => {
  it('does not end on a month with no developers', () => {
    // 271-274 have none; 270 has four.
    expect(digest.month).toBe(270)
  })

  it('does not report the collapse the dead tail produced', () => {
    // Was 0.0001 -- read as "critical drop" for a project averaging 0.88.
    expect(digest.forecast.latest).toBeGreaterThan(0.9)
  })

  it('ends every series at the last recorded month', () => {
    for (const s of Object.values(digest.technical.series))
      expect(Math.max(...s.map(p => p.month))).toBeLessThanOrEqual(270)

    expect(Math.max(...digest.forecast.series.map(p => p.month))).toBeLessThanOrEqual(270)
  })

  it('still shows the project, not a stub', () => {
    expect(digest.months_covered).toBeGreaterThan(200)
    // 4 developers in the final kept month, not the 0 the dead tail reported.
    expect(digest.technical.series.developers.at(-1).value).toBeGreaterThan(0)
    expect(digest.social.silent_developers.total).toBeGreaterThan(100)
  })
})
