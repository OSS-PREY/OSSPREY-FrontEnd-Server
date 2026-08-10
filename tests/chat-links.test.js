// The exact answer from the screenshot: every reference rendered as black text.
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '@/utils/renderMarkdown'

const ANSWER = `To contribute to the gem5 project, follow these steps as outlined in the CONTRIBUTING.md document: 1. Browse open issues on the Jira issue tracker (<https://gem5.atlassian.net>) or GitHub issue tracker (<https://github.com/gem5/gem5/issues>). 5. To contribute, fork the gem5 repository (<https://github.com/gem5/gem5>) and obtain it locally using:

\`\`\`sh
git clone https://github.com/{your github account}/gem5
\`\`\`

6. Make your changes and submit a pull request following the GitHub Pull-Request model (<https://docs.github.com/en/pull-requests>).`

describe('the screenshot answer', () => {
  it('links all four references', () => {
    const html = renderMarkdown(ANSWER)

    expect(html.match(/class="md-link"/g)).toHaveLength(4)
    for (const url of [
      'https://gem5.atlassian.net',
      'https://github.com/gem5/gem5/issues',
      'https://github.com/gem5/gem5',
      'https://docs.github.com/en/pull-requests',
    ])
      expect(html).toContain(`href="${url}"`)
  })

  it('leaves the URL inside the code block alone', () => {
    const html = renderMarkdown(ANSWER)
    const block = html.slice(html.indexOf('md-code'), html.indexOf('</figure>'))

    expect(block).not.toContain('<a ')
  })
})
