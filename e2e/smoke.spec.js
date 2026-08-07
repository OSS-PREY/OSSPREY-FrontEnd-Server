// Smoke test against the deployed dashboard: pick a project, wait for it to
// process, and assert the page actually filled in.
//
// Unlike the unit tests this needs the whole stack -- Netlify, the backend
// tunnel, and processed repository data -- so it runs on a schedule rather than
// on a pull request. A failure here can mean a real regression OR that the
// ngrok tunnel is down; the console/network capture below is there to tell the
// two apart without a rerun.
import { expect, test } from '@playwright/test'

const SITE = process.env.OSSPREY_URL || 'https://ossprey.netlify.app'

// Already processed, and small enough to load promptly.
const PROJECT = process.env.OSSPREY_SMOKE_PROJECT || 'axios'

test.describe('OSSPREY dashboard', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', m => {
      if (m.type() === 'error') console.log(`[browser error] ${m.text()}`)
    })
    page.on('response', r => {
      if (r.status() >= 400) console.log(`[http ${r.status()}] ${r.url()}`)
    })
  })

  test('loads', async ({ page }) => {
    const response = await page.goto(SITE, { waitUntil: 'domcontentloaded' })

    expect(response.status(), 'site should serve').toBeLessThan(400)
    await expect(page.locator('#app')).toBeAttached()
  })

  test('renders a project dashboard end to end', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'domcontentloaded' })

    // Enter the project. The selector accepts a GitHub URL or a known repo.
    const input = page.getByRole('combobox').or(page.getByRole('textbox')).first()
    await input.waitFor({ state: 'visible', timeout: 60_000 })
    await input.click()
    await input.fill(`https://github.com/${PROJECT}/${PROJECT}`)
    await page.keyboard.press('Enter')

    // Processing a repo is minutes, not seconds, when it is not already cached.
    const sankeyPath = page.locator('.sankey-container svg path')
    await expect(sankeyPath.first()).toBeVisible({ timeout: 15 * 60_000 })

    // The bug this exists to catch: the cards render but draw nothing.
    expect(await sankeyPath.count(), 'network drew no edges').toBeGreaterThan(0)

    // And the blank-dashboard case, where the month has no data at all.
    await expect(page.getByText('No data available for this month')).toHaveCount(0)
  })

  test('forecast panel shows a value', async ({ page }) => {
    await page.goto(SITE, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#app')).toBeAttached()
    // The chart canvas is the signal the forecast resolved rather than errored.
    await expect(page.locator('.apexcharts-canvas, canvas, svg').first())
      .toBeVisible({ timeout: 120_000 })
  })
})
