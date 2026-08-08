// Render the assistant's markdown as HTML.
//
// Written by hand rather than pulling in a parser: the answers use a small
// subset (fenced code, inline code, links, emphasis) and everything here is
// escape-first, so the output can only ever contain the tags built below. A
// general parser would be a much larger surface for a model-authored string.

import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ESCAPES[c])

// Anything not plainly http(s) or mailto is left as text rather than rendered,
// so `javascript:` and `data:` URLs can never become a live link.
const safeHref = url => (/^(https?:\/\/|mailto:)/i.test(url.trim()) ? url.trim() : null)

// Prism ships markup/css/clike/javascript in core; the rest are imported above.
const ALIASES = { js: 'javascript', sh: 'bash', shell: 'bash', py: 'python', yml: 'yaml' }

const highlight = (code, language) => {
  const name = ALIASES[language] || language
  const grammar = name && Prism.languages[name]
  if (!grammar) return escapeHtml(code)

  try {
    return Prism.highlight(code, grammar, name)
  } catch {
    return escapeHtml(code)
  }
}

const codeBlock = (code, language) => {
  const body = code.replace(/\n$/, '')
  const label = language ? escapeHtml(language) : 'code'

  // data-code carries the raw text for the copy button; it is escaped, so it
  // round-trips through the attribute without becoming markup.
  return (
    `<figure class="md-code" data-code="${escapeHtml(body)}">`
    + '<figcaption class="md-code__bar">'
    + `<span class="md-code__lang">${label}</span>`
    + '<button type="button" class="md-code__copy" aria-label="Copy code">Copy</button>'
    + '</figcaption>'
    + `<pre class="md-code__pre"><code class="md-code__code">${highlight(body, language)}</code></pre>`
    + '</figure>'
  )
}

// A sentinel that cannot occur in escaped text, so stashed inline code is
// restored exactly. A spaced number would collide with real numbers in prose.
const MARK = '\u0000'

// Inline code is extracted before anything else so URLs and asterisks inside it
// are never treated as markup.
const renderInline = text => {
  const spans = []

  let out = escapeHtml(text).replace(/`([^`\n]+)`/g, (_, code) => {
    spans.push(`<code class="md-inline-code">${code}</code>`)

    return `${MARK}${spans.length - 1}${MARK}`
  })

  // [label](url)
  out = out.replace(/\[([^\]]+)\]\((\S+?)\)/g, (whole, label, url) => {
    const href = safeHref(url)

    return href
      ? `<a class="md-link" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
      : whole
  })

  // Bare URLs. The leading boundary keeps this off URLs already inside an
  // href="..." produced by the step above.
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s<>()]+)/g, (whole, lead, url) => {
    const href = safeHref(url)

    return href
      ? `${lead}<a class="md-link" href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`
      : whole
  })

  out = out
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

  return out.replace(new RegExp(`${MARK}(\\d+)${MARK}`, 'g'), (_, i) => spans[Number(i)])
}

/**
 * Markdown subset -> HTML string, safe to bind with v-html.
 *
 * @param {string} text
 * @returns {string}
 */
export const renderMarkdown = text => {
  if (!text) return ''

  const parts = []

  // The trailing (```|$) closes an unterminated fence, which is what a
  // half-streamed answer always looks like mid-reveal.
  const fence = /```([\w+-]*)[ \t]*\n?([\s\S]*?)(?:```|$)/g
  let cursor = 0
  let match

  while ((match = fence.exec(text)) !== null) {
    if (match.index > cursor)
      parts.push(renderInline(text.slice(cursor, match.index)))

    parts.push(codeBlock(match[2], match[1]))
    cursor = fence.lastIndex
  }

  if (cursor < text.length)
    parts.push(renderInline(text.slice(cursor)))

  return parts.join('')
}
