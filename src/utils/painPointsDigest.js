// The measurement half of the getting-project-pain-points pipeline.
//
// RepoWise holds the project's markdown and nothing else -- no networks, no
// forecast, no repository metrics -- so every socio-technical number the
// analysis reasons over has to be computed here and sent explicitly.
//
// A digest rather than the raw networks: a processed repo's tech_net runs to
// megabytes, and posting it back to the server to be summarised there would
// move the same data twice for a result that is a couple of kilobytes.
import { rowsForMonth } from '@/utils/networkRows';

// Enough to show a direction without burying the model in history.
const WINDOW = 6;

// Rows arrive as [source, target, weight]; net-vis writes a bare [] for a month
// with no activity, and parseInt(undefined) is NaN, which poisons every sum.
const clean = rows => (Array.isArray(rows) ? rows : []).filter(
  r => Array.isArray(r) && r.length >= 3 && Number.isFinite(parseInt(r[2], 10)),
);

const weight = row => parseInt(row[2], 10);

// Foundation mode hands over one month's rows as a bare array; local mode hands
// over every month keyed by number. Only the latter has a history to trend.
const monthsOf = netData => {
  if (!netData || Array.isArray(netData)) return [];

  return Object.keys(netData).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
};

// The trend has to end at the month on screen. Slicing from the project's end
// meant a month-5 view was described by months 264-270, and the analysis then
// cited those numbers as if they belonged to month 5.
const windowEndingAt = (months, selectedMonth) => {
  const upto = selectedMonth === null || selectedMonth === undefined
    ? months
    : months.filter(m => m <= selectedMonth);

  // Empty when the selected month precedes all recorded activity, which is
  // honest: there is no history up to it to trend.
  return upto.slice(-WINDOW);
};

const seriesFor = (months, netData, measure) => months.map(month => ({
  month,
  value: measure(clean(rowsForMonth(netData, month))),
}));

/**
 * The last month that actually recorded a developer.
 *
 * A scrape's final months routinely carry no commit data: gem5's last four hold
 * a placeholder row and zero distinct developers, while its social network
 * carries on normally. Handed a month with no committers the forecaster returns
 * ~0, so the raw series ends 0.994, 0.0096, 0.005, 0.0001 -- and reported as-is
 * that reads as "critical collapse, all developers gone" for a project whose
 * forecast averages 0.88 over its last two years. It means the data ran out.
 *
 * Returns null when nothing was ever recorded, in which case nothing is trimmed.
 */
const lastRecordedMonth = (netData, months) => {
  for (let i = months.length - 1; i >= 0; i -= 1) {
    if (uniqueCount(clean(rowsForMonth(netData, months[i])), 0) > 0) return months[i];
  }

  return null;
};

// Every row the project ever recorded, for the lifetime view. Foundation mode
// hands over a single month as a bare array, which is already everything it has.
const everyRow = (netData, months) => (Array.isArray(netData)
  ? clean(netData)
  : months.flatMap(month => clean(rowsForMonth(netData, month))));

const uniqueCount = (rows, column) => new Set(rows.map(r => String(r[column]))).size;

const totalWeight = rows => rows.reduce((sum, r) => sum + weight(r), 0);

// Share of the month's activity carried by the busiest n participants. This is
// the bus-factor signal: one developer at 60% means the project has one
// developer, whatever the headcount says.
const topShare = (rows, column, n) => {
  const total = totalWeight(rows);
  if (!total) return null;

  const byActor = new Map();
  for (const row of rows) {
    const key = String(row[column]);
    byActor.set(key, (byActor.get(key) || 0) + weight(row));
  }

  const top = [...byActor.values()].sort((a, b) => b - a).slice(0, n);

  return top.reduce((sum, v) => sum + v, 0) / total;
};

// Files only one person has ever touched this month -- knowledge that leaves
// with them.
const soloFiles = rows => {
  const devsPerFile = new Map();
  for (const row of rows) {
    const file = String(row[1]);
    if (!devsPerFile.has(file)) devsPerFile.set(file, new Set());
    devsPerFile.get(file).add(String(row[0]));
  }

  return {
    count: [...devsPerFile.values()].filter(devs => devs.size === 1).length,
    total: devsPerFile.size,
  };
};

// Developers who shipped code this month but said nothing anywhere. Committing
// in silence is how a project stops being a community and becomes a fork queue.
const silentDevelopers = (techRows, socialRows) => {
  const talking = new Set();
  for (const row of socialRows) {
    talking.add(String(row[0]));
    talking.add(String(row[1]));
  }

  const committing = new Set(techRows.map(r => String(r[0])));

  return {
    count: [...committing].filter(dev => !talking.has(dev)).length,
    total: committing.size,
  };
};

/**
 * Everything the analysis reasons over, from what the store already holds.
 *
 * Returns null when there is nothing to analyse -- no networks and no forecast
 * -- so the caller can stay silent rather than asking the LLM about an empty
 * project.
 */
export const buildDigest = ({
  forecast = [],
  months = [],
  techNetData = null,
  socialNetData = null,
  selectedMonth = null,
  metadata = null,
  // 'window' -> the six months ending at selectedMonth, for the actionables
  // panel, which tracks the timeline. 'all' -> the whole project, for pain
  // points: "what is wrong here" is a question about the project, not about
  // whichever month the slider happens to sit on.
  span = 'window',
} = {}) => {
  const techMonths = monthsOf(techNetData);
  const socialMonths = monthsOf(socialNetData);
  const lifetime = span === 'all';

  // Trim the dead tail for the lifetime view. A month the user picked by hand
  // is left alone -- that is their choice to inspect.
  const recordedTo = lifetime ? lastRecordedMonth(techNetData, techMonths) : null;
  const upto = ms => (recordedTo === null ? ms : ms.filter(m => m <= recordedTo));

  const techWindow = lifetime
    ? upto(techMonths)
    : windowEndingAt(techMonths, selectedMonth);
  const socialWindow = lifetime
    ? upto(socialMonths)
    : windowEndingAt(socialMonths, selectedMonth);

  // The rows the point-in-time measures are taken over. Lifetime aggregates
  // every month, so the bus factor is the share of ALL the work one person did
  // rather than one month's -- a far steadier signal. Otherwise it is the month
  // on screen.
  const techRows = lifetime
    ? everyRow(techNetData, techWindow)
    : clean(rowsForMonth(techNetData, selectedMonth));
  const socialRows = lifetime
    ? everyRow(socialNetData, socialWindow)
    : clean(rowsForMonth(socialNetData, selectedMonth));

  const forecastPoints = forecast
    .map((value, index) => ({ month: months[index] ?? index, value: Number(value) }))
    .filter(p => Number.isFinite(p.value));

  if (!forecastPoints.length && !techRows.length && !socialRows.length) return null;

  const forecastWindow = lifetime
    ? upto(forecastPoints.map(p => p.month)).map(m =>
      forecastPoints.find(p => p.month === m))
    : (selectedMonth === null || selectedMonth === undefined
      ? forecastPoints
      : forecastPoints.filter(p => p.month <= selectedMonth)).slice(-WINDOW);

  const digest = {
    month: lifetime
      ? (recordedTo ?? months[months.length - 1] ?? selectedMonth)
      : selectedMonth,
    span,
    months_covered: lifetime
      ? Math.max(techWindow.length, socialWindow.length, forecastWindow.length)
      : undefined,
  };

  if (forecastWindow.length) {
    // `latest` is the selected month's value, not the project's final one.
    digest.forecast = {
      series: forecastWindow,
      latest: forecastWindow[forecastWindow.length - 1].value,
    };
  }

  if (techRows.length || techMonths.length) {
    digest.technical = {
      series: {
        developers: seriesFor(techWindow, techNetData, rows => uniqueCount(rows, 0)),
        files: seriesFor(techWindow, techNetData, rows => uniqueCount(rows, 1)),
        changes: seriesFor(techWindow, techNetData, totalWeight),
      },
      top_contributor_share: topShare(techRows, 0, 1),
      top_two_share: topShare(techRows, 0, 2),
      solo_files: soloFiles(techRows),
    };
  }

  if (socialRows.length || socialMonths.length) {
    digest.social = {
      series: {
        participants: seriesFor(socialWindow, socialNetData,
          rows => new Set(rows.flatMap(r => [String(r[0]), String(r[1])])).size),
        messages: seriesFor(socialWindow, socialNetData, totalWeight),
      },
      top_responder_share: topShare(socialRows, 0, 1),
      silent_developers: silentDevelopers(techRows, socialRows),
      empty: socialRows.length === 0,
    };
  }

  if (metadata) {
    digest.metadata = {
      stars: metadata.stars,
      forks: metadata.forks,
      watchers: metadata.watchers,
      languages: metadata.languages,
      updated_at: metadata.updated_at,
    };
  }

  return digest;
};
