// Both panels must analyse the same thing: the project's whole recorded life,
// with the dead scrape tail trimmed. Mounts them against one store seeded with
// gem5's real cached pipeline output and compares what each actually POSTs.
//
// No vi.resetModules() here: resetting the registry gave the test a different
// instance of the store module than the components imported, so seeding it did
// nothing and every digest came back empty.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import { useProjectStore } from '@/stores/projectStore'
import PainPoints from '@/views/dashboard/ProjectPainPoints.vue'
import Actionables from '@/views/dashboard/Actionables.vue'

const apiFetch = vi.fn()

vi.mock('@/utils/apiFetch', () => ({ apiFetch: (...a) => apiFetch(...a) }))
vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: () => 'http://test' }))
vi.mock('vuetify', () => ({ useTheme: () => ({ current: { value: { colors: {} } } }) }))

const F = JSON.parse(readFileSync(
  '/mnt/data1/OSSPREY/OSSPREY-Pex-Forecaster/forecasts/gem5.json', 'utf8'))
const N = JSON.parse(readFileSync(
  '/mnt/data1/OSSPREY/OSSPREY-Pex-Forecaster/net-vis/gem5.json', 'utf8'))
const MONTHS = Object.keys(F).map(Number).sort((a, b) => a - b)

const STUBS = {
  VCard: { template: '<div><slot /></div>' }, VCardText: { template: '<div><slot /></div>' },
  VCardItem: { template: '<div><slot /></div>' }, VRow: { template: '<div><slot /></div>' },
  VCol: { template: '<div><slot /></div>' }, VIcon: { template: '<i><slot /></i>' },
  VDialog: { template: '<div><slot /></div>' }, VBtn: { template: '<button><slot /></button>' },
  VChip: { template: '<span><slot /></span>' }, DashboardPanelHeader: { template: '<div />' },
}

const bodyFor = path => {
  const call = apiFetch.mock.calls.find(c => String(c[0]).includes(path))

  return call ? JSON.parse(call[1].body) : null
}

describe('both panels analyse the lifetime view', () => {
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())
    apiFetch.mockReset()
    apiFetch.mockReturnValue(Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))

    store = useProjectStore()
    store.gradForecastData = MONTHS.map(m => F[String(m)])
    store.xAxisCategories = MONTHS.map(m => `Month ${m}`)
    store.techNetData = N.tech
    store.socialNetData = N.social
    store.selectedMonth = 274        // the dead tail, where the dashboard opens
    store.selectedProject = {
      project_id: 'gem5', project_name: 'gem5',
      github_url: 'https://github.com/gem5/gem5.git',
    }

    mount(PainPoints, { global: { stubs: STUBS } })
    mount(Actionables, { global: { stubs: STUBS } })

    await vi.waitFor(() => {
      expect(bodyFor('/api/pain-points')).toBeTruthy()
      expect(bodyFor('/api/actionables')).toBeTruthy()
    })
  })

  it('both ask for the whole project', () => {
    expect(bodyFor('/api/pain-points').digest.span).toBe('all')
    expect(bodyFor('/api/actionables').digest.span).toBe('all')
  })

  it('both trim the dead scrape tail to the same month', () => {
    // 271-274 recorded no developers; 270 recorded four.
    expect(bodyFor('/api/pain-points').digest.month).toBe(270)
    expect(bodyFor('/api/actionables').digest.month).toBe(270)
  })

  it('neither reports the collapse the dead tail produced', () => {
    for (const path of ['/api/pain-points', '/api/actionables'])
      expect(bodyFor(path).digest.forecast.latest).toBeGreaterThan(0.9)
  })

  it('both see the technical network, not an empty digest', () => {
    for (const path of ['/api/pain-points', '/api/actionables']) {
      const digest = bodyFor(path).digest

      expect(digest.technical.series.developers.at(-1)).toEqual({ month: 270, value: 4 })
      expect(digest.months_covered).toBeGreaterThan(200)
    }
  })

  it('they analyse byte-identical evidence', () => {
    // Same project, same question about it -- any divergence means one panel is
    // reasoning about data the other cannot see.
    expect(bodyFor('/api/actionables').digest).toEqual(bodyFor('/api/pain-points').digest)
  })
})
