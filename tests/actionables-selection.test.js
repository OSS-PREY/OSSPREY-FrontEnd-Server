// The panel used to show the same ten entries for every project, because the
// only ranking applied was the catalog's own importance. These cover the
// swap-in of the server's project-specific selection and, more importantly,
// that the panel never comes up empty when that selection is unavailable.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const apiFetch = vi.fn()

vi.mock('@/utils/apiFetch', () => ({ apiFetch: (...args) => apiFetch(...args) }))
vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: () => 'http://test' }))
vi.mock('vuetify', () => ({ useTheme: () => ({ current: { value: { colors: {} } } }) }))

const ok = payload => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })

const SELECTED = [
  { title: 'Issue code of conduct statements', importance: 3, why: 'No CODE_OF_CONDUCT is present' },
  { title: 'Design incentives for second focal developers', importance: 3, why: 'Top two make 57% of changes' },
]

const CATALOG = Array.from({ length: 20 }, (_, i) => ({
  title: `generic entry ${i}`, importance: 4, confidence_score: 0.9,
}))

const STUBS = {
  VCard: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardItem: { template: '<div><slot /></div>' },
  VRow: { template: '<div><slot /></div>' },
  VCol: { template: '<div><slot /></div>' },
  VIcon: { template: '<i><slot /></i>' },
  VDialog: { template: '<div><slot /></div>' },
  VBtn: { template: '<button><slot /></button>' },
  VChip: { template: '<span><slot /></span>' },
  DashboardPanelHeader: { template: '<div />' },
}

let Actionables
let useProjectStore

const seed = async (store) => {
  store.reactData = CATALOG
  store.techNetData = { 1: [['ann', 'a.py', '40'], ['bob', 'b.py', '10']] }
  store.socialNetData = { 1: [['ann', 'carol', '2']] }
  store.selectedMonth = 1
  store.gradForecastData = [0.6, 0.4]
  store.xAxisCategories = ['Month 0', 'Month 1']
  store.selectedProject = { project_id: 'p', project_name: 'demo', github_url: 'https://github.com/o/r.git' }
}

describe('Actionables project-specific selection', () => {
  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    apiFetch.mockReset()
    ;({ default: Actionables } = await import('@/views/dashboard/Actionables.vue'))
    ;({ useProjectStore } = await import('@/stores/projectStore'))
  })

  it('sends the digest and the repo identity, not just the month', async () => {
    apiFetch.mockReturnValue(ok({ actionables: SELECTED }))

    const store = useProjectStore()

    await seed(store)
    mount(Actionables, { global: { stubs: STUBS } })

    // The store issues its own apiFetch calls when a project is selected, so
    // pick ours out by URL rather than assuming it is the first.
    const call = () => apiFetch.mock.calls.find(c => String(c[0]).includes('/api/actionables'))

    await vi.waitFor(() => expect(call()).toBeTruthy())

    const body = JSON.parse(call()[1].body)

    expect(body.github_url).toBe('https://github.com/o/r.git')
    // Concentration is the signal that separates this project from another.
    expect(body.digest.technical.top_contributor_share).toBeCloseTo(0.8)
  })

  it('shows the server selection in place of the catalog order', async () => {
    apiFetch.mockReturnValue(ok({ actionables: SELECTED }))

    const store = useProjectStore()

    await seed(store)

    const wrapper = mount(Actionables, { global: { stubs: STUBS } })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Issue code of conduct statements')
    })
    expect(wrapper.text()).not.toContain('generic entry')
  })

  it('renders the reason the entry was chosen', async () => {
    apiFetch.mockReturnValue(ok({ actionables: SELECTED }))

    const store = useProjectStore()

    await seed(store)

    const wrapper = mount(Actionables, { global: { stubs: STUBS } })

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('No CODE_OF_CONDUCT is present')
    })
  })

  it('keeps showing the catalog when selection fails', async () => {
    // A 503 from the index or the model must not empty the panel.
    apiFetch.mockReturnValue(Promise.resolve({
      ok: false, json: () => Promise.resolve({ message: 'unavailable' }),
    }))

    const store = useProjectStore()

    await seed(store)

    const wrapper = mount(Actionables, { global: { stubs: STUBS } })

    await vi.waitFor(() => expect(apiFetch).toHaveBeenCalled())
    await vi.waitFor(() => expect(wrapper.text()).toContain('generic entry'))
  })

  it('shows the shared loader while it is matching', async () => {
    apiFetch.mockReturnValue(new Promise(() => {}))

    const store = useProjectStore()

    await seed(store)

    const wrapper = mount(Actionables, { global: { stubs: STUBS } })

    await vi.waitFor(() => expect(wrapper.find('.thinking__word').exists()).toBe(true))
    expect(wrapper.find('.thinking__star').exists()).toBe(true)
  })

  it('does not call the server without a project', async () => {
    apiFetch.mockReturnValue(ok({ actionables: SELECTED }))
    mount(Actionables, { global: { stubs: STUBS } })

    await new Promise(r => setTimeout(r, 30))
    expect(apiFetch).not.toHaveBeenCalled()
  })
})

// The card was 450px tall inside the 400px the dashboard gives it, with
// overflow:hidden -- so the last 50px, where the scroll area ended up, was
// clipped away and the list truncated with a scrollbar that did nothing.
// Verified in a browser after the fix: 785px of content scrolling inside
// 368px, last row fully reachable.
describe('Actionables card layout', () => {
  it('fills its container instead of overflowing it', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/views/dashboard/Actionables.vue', 'utf8')
    const rule = src.slice(src.indexOf('.project-actionables-card {'))
    const body = rule.slice(0, rule.indexOf('}'))

    expect(body).toContain('block-size: 100%')
    // A fixed pixel height here is what caused the clipping.
    expect(body).not.toMatch(/height:\s*\d+px/)
  })

  it('keeps the shrink chain intact so the list can scroll', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/views/dashboard/Actionables.vue', 'utf8')

    // Without min-block-size:0 a flex child refuses to shrink below its
    // content height, and the scroll area never gets a bounded height. Both
    // links in the chain need it -- name them rather than counting, so an
    // unrelated rule elsewhere in the file cannot satisfy this by accident.
    const ruleFor = name => {
      const rest = src.slice(src.indexOf(`${name} {`))

      return rest.slice(0, rest.indexOf('}'))
    }

    expect(ruleFor('.actionables-body')).toContain('min-block-size: 0')
    expect(ruleFor('.table-container')).toContain('min-block-size: 0')
    expect(ruleFor('.table-container')).toContain('overflow-y: auto')
  })

  it('declares the scroll area exactly once', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/views/dashboard/Actionables.vue', 'utf8')

    // A second .table-container rule reintroduced a max-height and a
    // horizontal scrollbar on the same element.
    expect(src.match(/^\.table-container \{/gm) || []).toHaveLength(1)
  })

  it('does not carry the standing text that crowded the list out', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/views/dashboard/Actionables.vue', 'utf8')

    // These moved into the title tooltip.
    expect(src).not.toContain('How do you stay on track')
    expect(src).not.toContain('priority-labels')
    // The key itself must still exist, in the tooltip.
    expect(src).toContain('tooltip-key')
  })
})
