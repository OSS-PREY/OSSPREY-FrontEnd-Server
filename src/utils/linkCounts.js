// How many commits (or issues) a month actually had.
//
// The technical network cannot answer this: its edge weights are file changes,
// because the scraper CSV has one row per file touched. A month of 46 commits
// spread over many files summed to 1223. The link tables are the record of what
// happened, so count those.

/**
 * Distinct records and the people credited with them.
 *
 * Entries are already unique per (month, author, link); collapsing on the link
 * additionally merges one commit credited to two people. Entries with no link
 * cannot be deduplicated, so each counts once.
 *
 * @param {Array<{link?: string, dealised_author_full_name?: string}>} entries
 * @returns {{total: number, people: number}}
 */
export const countEntries = entries => {
  if (!Array.isArray(entries)) return { total: 0, people: 0 }

  const links = new Set()
  const authors = new Set()
  let unlinked = 0

  entries.forEach(entry => {
    if (!entry || typeof entry !== 'object') return
    if (entry.link) links.add(entry.link)
    else unlinked += 1
    if (entry.dealised_author_full_name) authors.add(entry.dealised_author_full_name)
  })

  return { total: links.size + unlinked, people: authors.size }
}
