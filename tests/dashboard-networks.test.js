// Mounts the network cards against fixture data and asserts they actually drew
// something. This is the hermetic stand-in for "pick a project and look at the
// dashboard": no backend, no network, no processed repositories.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'

// One store object both components read. Reset per test.
const store = reactive({
  techNetData: null,
  socialNetData: null,
  selectedMonth: null,
  selectedProject: null,
  techNetLoading: false,
  socialNetLoading: false,
  techNetError: null,
  socialNetError: null,
  isLocalMode: true,
  setReducedCommits: vi.fn(),
  setReducedEmails: vi.fn(),
})

vi.mock('@/stores/projectStore', () => ({ useProjectStore: () => store }))
vi.mock('@/components/DashboardPanelHeader.vue', () => ({
  default: { name: 'DashboardPanelHeader', template: '<div class="panel-header" />' },
}))

const VUETIFY_STUBS = ['VCard', 'VCardItem', 'VCardText', 'VRow', 'VCol', 'VProgressCircular']
  .reduce((acc, name) => {
    acc[name] = { name, template: '<div><slot /></div>' }

    return acc
  }, {})

// happy-dom reports every element as 0x0, and a Sankey laid out in a zero-width
// box produces nothing. Give the container the size a real card would have.
const sized = () => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 640 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 })
}

const mountNetwork = async component => {
  sized()
  const wrapper = mount(component, { global: { stubs: VUETIFY_STUBS } })
  await new Promise(r => setTimeout(r, 0))

  return wrapper
}

// A month with enough distinct contributors to lay out, all edges equal so the
// legibility threshold cannot single any out.
const monthRows = n => Array.from({ length: n }, (_, i) => [`dev${i}`, `file${i % 4}`, 3])

describe('Technical network card', () => {
  let TechnicalNetwork

  beforeEach(async () => {
    Object.assign(store, {
      techNetData: null, selectedMonth: null, selectedProject: null,
      techNetLoading: false, techNetError: null,
    })
    TechnicalNetwork = (await import('@/views/dashboard/TechnicalNetwork.vue')).default
  })

  it('draws links for a populated month', async () => {
    store.selectedProject = { project_id: 'demo', project_name: 'demo' }
    store.techNetData = { 5: monthRows(6) }
    store.selectedMonth = 5

    const wrapper = await mountNetwork(TechnicalNetwork)

    expect(wrapper.findAll('svg path').length).toBeGreaterThan(0)
    expect(wrapper.text()).not.toContain('No data available')
  })

  it('draws month 0, which local repos are keyed from', async () => {
    // `selectedMonth ? ... : ""` treated month 0 as absent, so the card came up
    // blank for every project whose data starts at 0.
    store.selectedProject = { project_id: 'demo', project_name: 'demo' }
    store.techNetData = { 0: monthRows(6) }
    store.selectedMonth = 0

    const wrapper = await mountNetwork(TechnicalNetwork)

    expect(wrapper.findAll('svg path').length).toBeGreaterThan(0)
  })

  it('says so when the month is genuinely empty', async () => {
    store.selectedProject = { project_id: 'demo', project_name: 'demo' }
    store.techNetData = { 7: [[]] }
    store.selectedMonth = 7

    const wrapper = await mountNetwork(TechnicalNetwork)

    expect(wrapper.text()).toContain('No data available')
  })

  it('asks for a project before one is chosen', async () => {
    const wrapper = await mountNetwork(TechnicalNetwork)

    expect(wrapper.text()).toContain('Please select a project')
  })
})

describe('Social network card', () => {
  let SocialNetwork

  beforeEach(async () => {
    Object.assign(store, {
      socialNetData: null, selectedMonth: null, selectedProject: null,
      socialNetLoading: false, socialNetError: null,
    })
    SocialNetwork = (await import('@/views/dashboard/SocialNetwork.vue')).default
  })

  it('draws links for a populated month', async () => {
    store.selectedProject = { project_id: 'demo', project_name: 'demo' }
    store.socialNetData = { 5: monthRows(6) }
    store.selectedMonth = 5

    const wrapper = await mountNetwork(SocialNetwork)

    expect(wrapper.findAll('svg path').length).toBeGreaterThan(0)
  })

  it('draws month 0', async () => {
    store.selectedProject = { project_id: 'demo', project_name: 'demo' }
    store.socialNetData = { 0: monthRows(6) }
    store.selectedMonth = 0

    const wrapper = await mountNetwork(SocialNetwork)

    expect(wrapper.findAll('svg path').length).toBeGreaterThan(0)
  })
})
