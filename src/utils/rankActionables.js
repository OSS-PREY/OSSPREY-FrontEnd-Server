// Ranking for ReACT actionables.
//
// `importance` is a 1-4 integer, so it cannot order 3837 catalog entries: 430
// share the top value. A plain sort on it is stable, which means the visible
// top 10 was really "the first 10 matching rows in updated_react_set2.json".
// confidence_score is populated on every entry (78 distinct values, 0.6-1.0)
// and breaks that tie on the strength of the underlying evidence.

const score = entry => ({
  importance: Number(entry?.importance) || 0,
  // Missing confidence sorts last within its importance band rather than
  // ahead of a measured 0.6.
  confidence: Number(entry?.confidence_score) || 0,
})

/**
 * Compare two actionables: importance first, then confidence, both descending.
 *
 * Sorting is stable, so entries equal on both keep catalog order.
 */
export const byRank = (a, b) => {
  const left = score(a)
  const right = score(b)

  return right.importance - left.importance || right.confidence - left.confidence
}

/**
 * The highest-ranked actionables, without mutating the input.
 *
 * @param {Array<object>} entries
 * @param {number} limit
 * @returns {Array<object>}
 */
export const topActionables = (entries, limit = 10) =>
  Array.isArray(entries) ? [...entries].sort(byRank).slice(0, limit) : []
