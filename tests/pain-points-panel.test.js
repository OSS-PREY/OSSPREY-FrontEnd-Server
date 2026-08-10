// The panel above the project details: what it asks for, what it shows while
// waiting, and what it does when the analysis cannot run.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const apiFetch = vi.fn()

vi.mock('@/utils/apiFetch', () => ({ apiFetch: (...args) => apiFetch(...args) }))
vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: () => 'http://test' }))

const ok = payload => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })

const PAIN_POINTS = ['- Contributors fell 55% (m9=31, m12=14)', '- One developer makes 80% of changes']

// Two developers, one doing nearly all the work -- a digest that is not empty.
const TECH = { 1: [['ann', 'a.py', '40'], ['bob', 'b.py', '10']] }

let ProjectPainPoints
let useProjectStore

const mountPanel = async (githubUrl) => {
  const store = useProjectStore()

  store.techNetData = TECH
  // ann talks to carol; bob ships code and says nothing.
  store.socialNetData = { 1: [['ann', 'carol', '2']] }
  store.selectedMonth = 1
  store.gradForecastData = [0.6, 0.4]
  store.xAxisCategories = ['Month 0', 'Month 1']
  store.selectedProject = { project_id: 'p', project_name: 'demo', github_url: githubUrl }

  const wrapper = mount(ProjectPainPoints, {
    global: { stubs: { VIcon: { template: '<i><slot /></i>' } } },
  })

  await vi.waitFor(() => expect(apiFetch).toHaveBeenCalled())

  return wrapper
}

describe('ProjectPainPoints', () => {
  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    apiFetch.mockReset()
    ;({ default: ProjectPainPoints } = await import('@/views/dashboard/ProjectPainPoints.vue'))
    ;({ useProjectStore } = await import('@/stores/projectStore'))
  })

  it('sends the socio-technical digest, because RepoWise does not have it', async () => {
    apiFetch.mockReturnValue(ok({ pain_points: PAIN_POINTS }))
    await mountPanel('https://github.com/o/a.git')

    const body = JSON.parse(apiFetch.mock.calls[0][1].body)

    expect(apiFetch.mock.calls[0][0]).toContain('/api/pain-points')
    expect(body.github_url).toBe('https://github.com/o/a.git')
    expect(body.digest.technical.top_contributor_share).toBeCloseTo(0.8)
    expect(body.digest.social.silent_developers.count).toBe(1)
  })

  it('renders each pain point as its own bullet', async () => {
    apiFetch.mockReturnValue(ok({ pain_points: PAIN_POINTS }))

    const wrapper = await mountPanel('https://github.com/o/b.git')

    await vi.waitFor(() => {
      expect(wrapper.findAll('li').length).toBe(2)
      expect(wrapper.text()).toContain('One developer makes 80% of changes')
    })
    // The leading marker is the list's job, not the text's.
    expect(wrapper.findAll('li')[0].text().startsWith('-')).toBe(false)
  })

  it('shows a rotating word while the analysis runs', async () => {
    // Inference takes minutes; a static panel reads as broken.
    apiFetch.mockReturnValue(new Promise(() => {}))

    const wrapper = await mountPanel('https://github.com/o/c.git')

    // The same shared loader the chat bubble uses, so the two cannot drift.
    const word = wrapper.find('.thinking__word')

    expect(word.exists()).toBe(true)
    expect(word.text().length).toBeGreaterThan(3)
    expect(wrapper.find('.thinking__star').exists()).toBe(true)
    expect(wrapper.find('.thinking__meta').exists()).toBe(true)
  })

  it('says nothing rather than asking about an empty project', async () => {
    apiFetch.mockReturnValue(ok({ pain_points: PAIN_POINTS }))

    const store = useProjectStore()

    store.selectedProject = { project_id: 'p', github_url: 'https://github.com/o/d.git' }

    const wrapper = mount(ProjectPainPoints, {
      global: { stubs: { VIcon: { template: '<i><slot /></i>' } } },
    })

    await vi.waitFor(() => expect(wrapper.text()).toContain('Not enough project data'))
    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('offers a retry when the analysis fails', async () => {
    apiFetch.mockReturnValue(Promise.resolve({
      ok: false, json: () => Promise.resolve({ message: 'Pain point analysis is temporarily unavailable.' }),
    }))

    const wrapper = await mountPanel('https://github.com/o/e.git')

    await vi.waitFor(() => expect(wrapper.text()).toContain('temporarily unavailable'))
    expect(wrapper.find('.pain-points__retry').exists()).toBe(true)
  })

  it('reports a clean project instead of inventing problems', async () => {
    apiFetch.mockReturnValue(ok({ pain_points: [], message: 'No pain points stood out.' }))

    const wrapper = await mountPanel('https://github.com/o/f.git')

    await vi.waitFor(() => expect(wrapper.text()).toContain('No pain points stood out'))
    expect(wrapper.findAll('li')).toHaveLength(0)
  })
})
