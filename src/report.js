/**
 * Report formatter for depvibe.
 * Terminal output with colors (when TTY), JSON, and CI-friendly.
 * Colors are disabled by `useColor: false` (the `--no-color` flag) or a
 * non-empty NO_COLOR environment variable (https://no-color.org/).
 */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const BLUE = "\x1b[34m";

function colorize(text, color, useColor) {
  return useColor ? `${color}${text}${RESET}` : text;
}

function verdictColor(verdict, useColor) {
  if (verdict === "compatible" || verdict === "healthy" || verdict === "active" || verdict === "responsive") {
    return colorize(verdict.toUpperCase(), GREEN, useColor);
  }
  if (verdict === "conditional" || verdict === "caution" || verdict === "maintenance" || verdict === "slow") {
    return colorize(verdict.toUpperCase(), YELLOW, useColor);
  }
  if (verdict === "incompatible" || verdict === "unhealthy" || verdict === "dead" || verdict === "unresponsive") {
    return colorize(verdict.toUpperCase(), RED, useColor);
  }
  return colorize(verdict.toUpperCase(), DIM, useColor);
}

/**
 * Format a full depvibe report.
 *
 * @param {object} data
 * @param {string} data.name - package name
 * @param {string} data.version - package version
 * @param {object} data.license - { verdict, reason, normalized }
 * @param {object} data.health - healthVerdict result
 * @param {boolean} [data.useColor=true] - false disables ANSI colors
 * @returns {string}
 */
export function formatReport(data) {
  const noColorEnv = Boolean(process.env.NO_COLOR);
  const useColor = data.useColor !== false && !noColorEnv && Boolean(process.stdout.isTTY);
  const lines = [];

  lines.push("");
  lines.push(colorize("depvibe — " + (data.name || "unknown"), BOLD, useColor));
  if (data.version) lines.push(colorize(`  version: ${data.version}`, DIM, useColor));
  lines.push("");

  // License section
  lines.push(colorize("LICENSE", BOLD, useColor));
  if (data.license) {
    lines.push(`  ${verdictColor(data.license.verdict, useColor)}  ${data.license.normalized || data.license.raw || "?"}`);
    lines.push(colorize(`  ${data.license.reason}`, DIM, useColor));
  } else {
    lines.push(colorize("  No license data.", DIM, useColor));
  }
  lines.push("");

  // Health section
  lines.push(colorize("HEALTH", BOLD, useColor));
  if (data.health) {
    const h = data.health;
    lines.push(`  ${verdictColor(h.overall, useColor)}  ${h.alive.status} / ${h.responsive.status}`);
    lines.push(colorize(`  ${h.alive.reason}`, DIM, useColor));
    lines.push(colorize(`  ${h.responsive.reason}`, DIM, useColor));
    if (h.daysSinceCommit !== null) lines.push(colorize(`  Last commit: ${h.daysSinceCommit} days ago`, DIM, useColor));
    if (h.daysSinceRelease !== null) lines.push(colorize(`  Last release: ${h.daysSinceRelease} days ago`, DIM, useColor));
    if (h.openIssues > 0) lines.push(colorize(`  Open issues: ${h.openIssues}`, DIM, useColor));
    if (h.stars > 0) lines.push(colorize(`  Stars: ${h.stars}  Forks: ${h.forks}`, DIM, useColor));
  } else {
    lines.push(colorize("  No health data.", DIM, useColor));
  }
  lines.push("");

  // Overall verdict
  const licenseOk = data.license?.verdict === "compatible";
  const healthOk = data.health?.overall === "healthy";
  const conditional = data.license?.verdict === "conditional";

  let overall;
  if (licenseOk && healthOk) overall = colorize("DEPEND. Safe to use.", GREEN, useColor);
  else if (conditional && healthOk) overall = colorize("DEPEND WITH CAUTION. License is conditional.", YELLOW, useColor);
  else if (!licenseOk && healthOk) overall = colorize("DO NOT DEPEND. License incompatible.", RED, useColor);
  else if (licenseOk && !healthOk) overall = colorize("DEPEND WITH CAUTION. Project health is poor.", YELLOW, useColor);
  else overall = colorize("DO NOT DEPEND. License and health both fail.", RED, useColor);

  lines.push(colorize("VERDICT", BOLD, useColor));
  lines.push(`  ${overall}`);
  lines.push("");

  if (data.errors && data.errors.length > 0) {
    lines.push(colorize("WARNINGS", YELLOW, useColor));
    for (const e of data.errors) lines.push(colorize(`  - ${e}`, YELLOW, useColor));
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format as JSON.
 */
export function formatJson(data) {
  return JSON.stringify(
    {
      name: data.name,
      version: data.version,
      license: data.license,
      health: data.health,
      errors: data.errors || [],
    },
    null,
    2
  );
}
