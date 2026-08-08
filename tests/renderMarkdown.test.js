// The chat bubble printed raw markdown: literal ``` fences and bare URLs.
// This renders it -- and, since the input is a model-authored string bound with
// v-html, the escaping boundary matters as much as the formatting.
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '@/utils/renderMarkdown'

describe('renderMarkdown code blocks', () => {
  it('turns a fenced block into a figure with its language', () => {
    const html = renderMarkdown('Run this:\n```bash\ngit clone x\n```')

    expect(html).toContain('class="md-code"')
    expect(html).toContain('>bash<')
    expect(html).toContain('md-code__copy')
    expect(html).not.toContain('```')
  })

  it('keeps the raw code on the element for the copy button', () => {
    const html = renderMarkdown('```\ngit add .\n```')

    expect(html).toContain('data-code="git add ."')
  })

  it('closes a fence that is still streaming in', () => {
    // Mid-reveal every answer looks like an unterminated fence.
    const html = renderMarkdown('```python\nprint(1)')

    expect(html).toContain('class="md-code"')
    expect(html).toContain('print')
  })

  it('labels an unlabelled block rather than showing nothing', () => {
    expect(renderMarkdown('```\nplain\n```')).toContain('>code<')
  })
})

describe('renderMarkdown links', () => {
  it('linkifies a bare URL', () => {
    const html = renderMarkdown('See https://github.com/a/b for details')

    expect(html).toContain('href="https://github.com/a/b"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })

  it('renders a labelled link', () => {
    const html = renderMarkdown('[the docs](https://example.com/x)')

    expect(html).toContain('href="https://example.com/x"')
    expect(html).toContain('>the docs</a>')
  })

  it('does not linkify a URL inside code', () => {
    const html = renderMarkdown('`https://example.com`')

    expect(html).toContain('md-inline-code')
    expect(html).not.toContain('<a ')
  })
})

describe('renderMarkdown safety', () => {
  it('escapes HTML in the answer', () => {
    const html = renderMarkdown('<script>alert(1)</script>')

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes HTML inside a code block', () => {
    const html = renderMarkdown('```\n<img onerror=alert(1)>\n```')

    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('refuses a javascript: URL', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')

    expect(html).not.toContain('href="javascript:')
    expect(html).not.toContain('<a ')
  })

  it('refuses a data: URL', () => {
    expect(renderMarkdown('[x](data:text/html;base64,PHN2Zz4=)')).not.toContain('<a ')
  })

  it('escapes a quote that would break out of the data-code attribute', () => {
    const html = renderMarkdown('```\nsay "hi"\n```')

    expect(html).toContain('&quot;hi&quot;')
    expect(html).not.toContain('data-code="say "hi""')
  })
})

describe('renderMarkdown text', () => {
  it('leaves plain numbers alone', () => {
    // The inline-code stash used to use a spaced number as its placeholder,
    // which swallowed real numbers out of the prose.
    const html = renderMarkdown('there were 3 commits and `x` files')

    expect(html).toContain('there were 3 commits')
    expect(html).toContain('md-inline-code')
  })

  it('renders emphasis', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
    expect(renderMarkdown('*it*')).toContain('<em>it</em>')
  })

  it('handles empty input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
  })
})
