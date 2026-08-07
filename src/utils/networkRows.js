// The one place that decides what a network month actually shows.
//
// The Sankey cards drop edges too thin to read once a month carries 100+
// interactions, and both cards, the six stat cards and the dashboard's default
// month all have to agree on the result -- when they disagreed, the dashboard
// opened on a month whose networks were empty.

// Rows a Sankey will actually draw, given one month's raw edge list.
export const renderableRows = inputArray => {
  if (!Array.isArray(inputArray)) return [];

  // Rows can arrive malformed: net-vis writes a bare [] for a month with no
  // activity, and parseInt(undefined) is NaN, which poisons the sum and the
  // threshold and silently filtered out every row.
  const rows = inputArray.filter(
    item => Array.isArray(item) && item.length >= 3 && Number.isFinite(parseInt(item[2], 10)),
  );
  const total = rows.reduce((sum, item) => sum + parseInt(item[2], 10), 0);
  const threshold = total < 100 ? 0 : Math.ceil(total / 100);

  return rows.filter(item => parseInt(item[2], 10) > threshold);
};

// One month out of a network payload. Foundation mode hands over an array for
// the month already; local mode hands over every month keyed by number.
export const rowsForMonth = (netData, month) => {
  if (!netData) return [];
  const rows = Array.isArray(netData) ? netData : netData[String(month)];

  return Array.isArray(rows) ? rows : [];
};

// Does this month draw anything at all?
export const monthRenders = (netData, month) =>
  renderableRows(rowsForMonth(netData, month)).length > 0;

/**
 * The month the dashboard should open on.
 *
 * Newest month showing both networks, else the newest showing the technical
 * network, else a month at random. Never the plain newest month: that is
 * frequently empty (gem5's has no commits at all), which is what made the
 * dashboard come up blank.
 *
 * The jump backwards is small -- a median of 1 month and at most 13 across the
 * 25 processed repositories -- so "current month" stays honest. The month is
 * labelled on screen and the slider still covers the full range.
 */
export const defaultMonth = (months, techNetData, socialNetData) => {
  if (!Array.isArray(months) || months.length === 0) return null;

  const newestFirst = [...months].sort((a, b) => b - a);

  const both = newestFirst.find(
    m => monthRenders(techNetData, m) && monthRenders(socialNetData, m),
  );
  if (both !== undefined) return both;

  const tech = newestFirst.find(m => monthRenders(techNetData, m));
  if (tech !== undefined) return tech;

  // Nothing renders anywhere. No processed repository is in this state today,
  // and every month would be blank if one were, so this only decides where the
  // slider sits.
  return months[Math.floor(Math.random() * months.length)];
};
