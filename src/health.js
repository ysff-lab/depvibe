/**
 * Health checker for depvibe.
 *
 * Answers: "Is this project alive and is the maintainer responsive?"
 *
 * Health signals:
 *   - lastCommit: days since last commit
 *   - openIssues: number of open issues
 *   - issueResponse: median days to first response on recent issues
 *   - lastRelease: days since last release (null if none)
 *   - stars, forks: popularity signals
 *
 * Verdicts:
 *   alive: active (<90d), maintenance (90-365d), stale (365-730d), dead (>730d)
 *   responsive: responsive (<14d median), slow (14-30d), unresponsive (>30d or no data)
 */

const DAY = 86400000;

export function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / DAY);
}

export function aliveVerdict(daysSinceCommit) {
  if (daysSinceCommit === null) return { status: "unknown", reason: "No commit data available." };
  if (daysSinceCommit < 90) return { status: "active", reason: `Last commit ${daysSinceCommit} days ago. Active.` };
  if (daysSinceCommit < 365) return { status: "maintenance", reason: `Last commit ${daysSinceCommit} days ago. Maintenance mode.` };
  if (daysSinceCommit < 730) return { status: "stale", reason: `Last commit ${daysSinceCommit} days ago. Stale.` };
  return { status: "dead", reason: `Last commit ${daysSinceCommit} days ago. Likely dead.` };
}

export function responsiveVerdict(medianResponseDays) {
  if (medianResponseDays === null) return { status: "unknown", reason: "No issue response data." };
  if (medianResponseDays < 14) return { status: "responsive", reason: `Median response: ${medianResponseDays} days. Responsive.` };
  if (medianResponseDays <= 30) return { status: "slow", reason: `Median response: ${medianResponseDays} days. Slow.` };
  return { status: "unresponsive", reason: `Median response: ${medianResponseDays} days. Unresponsive.` };
}

/**
 * Compute median of a numeric array.
 */
export function median(arr) {
  if (!arr || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

/**
 * Compute median issue response time in days from a list of issues.
 * Each issue: { created_at, comments, ... } or { created_at, first_response_at }
 * Falls back to closed_at if no response data.
 */
export function computeMedianResponse(issues) {
  if (!issues || issues.length === 0) return null;
  const responseDays = [];
  for (const issue of issues) {
    if (issue.first_response_at) {
      const created = new Date(issue.created_at);
      const responded = new Date(issue.first_response_at);
      if (!isNaN(created.getTime()) && !isNaN(responded.getTime())) {
        responseDays.push((responded.getTime() - created.getTime()) / DAY);
      }
    } else if (issue.closed_at && issue.created_at) {
      const created = new Date(issue.created_at);
      const closed = new Date(issue.closed_at);
      if (!isNaN(created.getTime()) && !isNaN(closed.getTime())) {
        responseDays.push((closed.getTime() - created.getTime()) / DAY);
      }
    }
  }
  return median(responseDays);
}

/**
 * Overall health verdict combining alive + responsive.
 */
export function healthVerdict(healthData) {
  const {
    lastCommitDate,
    openIssues = 0,
    issueResponseDays = null,
    lastReleaseDate = null,
    stars = 0,
    forks = 0,
  } = healthData || {};

  const daysCommit = daysSince(lastCommitDate);
  const alive = aliveVerdict(daysCommit);
  const responsive = responsiveVerdict(issueResponseDays);

  let overall;
  if (alive.status === "dead" || responsive.status === "unresponsive" ||
      (alive.status === "unknown" && responsive.status === "unknown")) {
    overall = "unhealthy";
  } else if (alive.status === "stale" || responsive.status === "slow" ||
             alive.status === "unknown" || responsive.status === "unknown") {
    overall = "caution";
  } else {
    overall = "healthy";
  }

  return {
    overall,
    alive,
    responsive,
    daysSinceCommit: daysCommit,
    daysSinceRelease: daysSince(lastReleaseDate),
    openIssues,
    stars,
    forks,
  };
}

/**
 * Format health verdict as a one-line summary.
 */
export function healthSummary(v) {
  if (!v) return "No health data.";
  const parts = [];
  parts.push(`Alive: ${v.alive.status} (${v.daysSinceCommit !== null ? v.daysSinceCommit + "d since commit" : "no data"})`);
  parts.push(`Responsive: ${v.responsive.status} (${v.responsive.reason})`);
  if (v.openIssues > 0) parts.push(`Open issues: ${v.openIssues}`);
  if (v.stars > 0) parts.push(`Stars: ${v.stars}`);
  return parts.join(" | ");
}
