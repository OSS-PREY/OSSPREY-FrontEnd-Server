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

describe('renderMarkdown autolinks', () => {
  // The model writes <https://...> constantly. escapeHtml turned it into
  // &lt;https://...&gt; before the bare-URL rule ran, and that rule wanted
  // whitespace or ( before the scheme -- it saw ';' and skipped every one, so a
  // whole answer full of references rendered as plain black text.
  it('links an angle-bracketed URL and drops the brackets', () => {
    const html = renderMarkdown('Browse the tracker (<https://gem5.atlassian.net>) first')

    expect(html).toContain('href="https://gem5.atlassian.net"')
    expect(html).toContain('>https://gem5.atlassian.net</a>')
    expect(html).not.toContain('&lt;https')
  })

  it('links every autolink in a paragraph of them', () => {
    const html = renderMarkdown(
      'See <https://github.com/gem5/gem5/issues> and <https://docs.github.com/en/pull-requests>.')

    expect(html.match(/<a /g)).toHaveLength(2)
  })

  it('keeps sentence punctuation out of the href', () => {
    const html = renderMarkdown('Read https://example.com/docs.')

    expect(html).toContain('href="https://example.com/docs"')
    expect(html).toContain('</a>.')
  })

  it('does not cut a query string at its escaped ampersand', () => {
    // & escapes to &amp;, so a naive delimiter would truncate the URL.
    const html = renderMarkdown('https://example.com/s?a=1&b=2')

    expect(html).toContain('a=1&amp;b=2"')
  })

  it('still refuses a javascript: autolink', () => {
    expect(renderMarkdown('<javascript:alert(1)>')).not.toContain('<a ')
  })
})
