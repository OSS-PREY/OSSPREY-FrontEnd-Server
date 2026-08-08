// Processing a second repo must not leave any of the first one on screen.
//
// applyPipelineResult assigned each field only `if (data.x)`, so a result with
// no social network -- routine, because the issue scrape is what GitHub
// rate-limits -- kept the previous repo's network, forecast and metadata.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/utils/apiFetch', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) })),
}))
vi.mock('@/utils/apiBase', () => ({ getApiBaseUrl: () => 'http://test' }))

const REPO_A = {
  forecast_json: { 0: 0.4, 1: 0.5 },
  tech_net: { 0: [['dev', 'file.py', '3']] },
  social_net: { 0: [['a@x.com', 'b@x.com', '2']] },
  metadata: { stars: 10 },
  commit_data: { 0: [{ link: 'c1' }] },
  issue_data: { 0: [{ link: 'i1' }] },
}

// The realistic failure: the scrape came back with commits but no issues.
const REPO_B = { forecast_json: { 0: 0.9 }, tech_net: { 0: [['dev2', 'x.js', '1']] } }

describe('applyPipelineResult isolation', () => {
  let store

  beforeEach(async () => {
    setActivePinia(createPinia())

    const { useProjectStore } = await import('@/stores/projectStore')

    store = useProjectStore()
    store.isLocalMode = true
  })

  it('drops the previous repo social network when the new one has none', async () => {
    await store.applyPipelineResult(REPO_A, 'https://github.com/o/a.git')
    expect(store.socialNetData).not.toBeNull()

    await store.applyPipelineResult(REPO_B, 'https://github.com/o/b.git')
    expect(store.socialNetData).toBeNull()
  })

  it('drops the previous metadata and raw data', async () => {
    await store.applyPipelineResult(REPO_A, 'https://github.com/o/a.git')
    await store.applyPipelineResult(REPO_B, 'https://github.com/o/b.git')

    expect(store.localMetadata).toBeNull()
    expect(store.rawLocalCommitData).toBeNull()
    expect(store.rawLocalEmailData).toBeNull()
  })

  it('replaces the forecast rather than leaving the longer one', async () => {
    await store.applyPipelineResult(REPO_A, 'https://github.com/o/a.git')
    expect(store.gradForecastData).toHaveLength(2)

    await store.applyPipelineResult(REPO_B, 'https://github.com/o/b.git')
    expect(store.gradForecastData).toHaveLength(1)
    expect(store.gradForecastData[0]).toBe(0.9)
  })

  it('does not carry the selected month across repos', async () => {
    await store.applyPipelineResult(REPO_A, 'https://github.com/o/a.git')
    store.selectedMonth = 1

    await store.applyPipelineResult(REPO_B, 'https://github.com/o/b.git')
    // Repo B only has month 0; month 1 would render an empty dashboard.
    expect(store.selectedMonth).not.toBe(1)
  })

  it('points the selection at the new repo', async () => {
    await store.applyPipelineResult(REPO_A, 'https://github.com/o/a.git')
    await store.applyPipelineResult(REPO_B, 'https://github.com/o/b.git')

    expect(store.selectedProject.github_url).toContain('/b.git')
  })

  it('clears the per-month counters', async () => {
    await store.applyPipelineResult(REPO_A, 'https://github.com/o/a.git')
    store.monthCommitCount = 46

    await store.applyPipelineResult(REPO_B, 'https://github.com/o/b.git')
    expect(store.monthCommitCount).toBe(0)
  })
})
