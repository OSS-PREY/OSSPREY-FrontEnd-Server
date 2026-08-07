// Dark mode shipped once with panel headings at 2.7:1 and Sankey labels in a
// light-theme grey on a near-black card. Contrast is arithmetic, so assert it
// rather than judging it by eye.
import { describe, expect, it } from 'vitest'
import { themes } from '@/plugins/vuetify/theme'

const srgb = c => {
  const v = c / 255

  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

const luminance = hex => {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const [r, g, b] = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16))

  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}

const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)

  return (x + 0.05) / (y + 0.05)
}

// WCAG AA: 4.5:1 for body text, 3:1 for large text and graphical objects.
const AA_TEXT = 4.5
const AA_GRAPHIC = 3

describe.each(['light', 'dark'])('%s theme', name => {
  const c = themes[name].colors

  it.each([
    ['heading on surface', 'heading', 'surface', AA_TEXT],
    ['link on surface', 'link', 'surface', AA_TEXT],
    ['body text on background', 'on-background', 'background', AA_TEXT],
    ['body text on surface', 'on-surface', 'surface', AA_TEXT],
    ['network node label on surface', 'net-label', 'surface', AA_TEXT],
    ['chip text on chip', 'chip-on-surface', 'chip-surface', AA_TEXT],
    ['network edge stroke on surface', 'net-stroke', 'surface', AA_GRAPHIC],
  ])('%s clears its floor', (_label, fg, bg, floor) => {
    expect(c[fg], `${name}.${fg} is not defined`).toBeDefined()
    expect(c[bg], `${name}.${bg} is not defined`).toBeDefined()
    expect(ratio(c[fg], c[bg])).toBeGreaterThanOrEqual(floor)
  })
})

describe('dark theme surfaces', () => {
  it('separates cards from the page behind them', () => {
    // Both were near-identical, so cards vanished into the background. The
    // light theme separates with elevation shadows instead, so this is
    // deliberately dark-only.
    const c = themes.dark.colors

    expect(ratio(c.surface, c.background)).toBeGreaterThan(1.05)
  })

  it('is actually darker than the light theme', () => {
    expect(luminance(themes.dark.colors.background))
      .toBeLessThan(luminance(themes.light.colors.background))
  })
})
