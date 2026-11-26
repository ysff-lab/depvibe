/**
 * depvibe — "should I depend on this?"
 *
 * Offline core + optional network layer.
 * Zero runtime dependencies.
 */

import { checkLicense } from "./license.js";
import { healthVerdict, computeMedianResponse } from "./health.js";
import { networkCheck } from "./network.js";
import { formatReport, formatJson } from "./report.js";

export { checkLicense, normalizeLicense } from "./license.js";
export { healthVerdict, aliveVerdict, responsiveVerdict, computeMedianResponse, median, daysSince } from "./health.js";
export { networkCheck, parseGitHubRepo, fetchNpm, fetchGitHub } from "./network.js";
export { formatReport, formatJson } from "./report.js";

/**
 * Run a full depvibe check.
 *
 * @param {object} opts
 * @param {string} [opts.pkg] - package name or "owner/repo"
 * @param {string} [opts.license] - license string (offline mode)
 * @param {object} [opts.healthData] - health data object (offline mode)
 * @param {string} [opts.projectLicense="MIT"] - consuming project's license
 * @param {boolean} [opts.network=true] - fetch from network
 * @returns {Promise<object>} report data
 */
export async function runCheck(opts = {}) {
  const {
    pkg,
    license: licenseStr,
    healthData,
    projectLicense = "MIT",
    network = true,
  } = opts;

  const data = {
    name: pkg || "unknown",
    version: null,
    license: null,
    health: null,
    errors: [],
    useColor: true,
  };

  // Offline license check
  if (licenseStr) {
    data.license = checkLicense(licenseStr, projectLicense);
  }

  // Offline health check
  if (healthData) {
    data.health = healthVerdict(healthData);
  }

  // Network layer
  if (network && pkg) {
    try {
      const net = await networkCheck(pkg);

      // Fill license from npm if not provided offline
      if (!data.license && net.npm?.license) {
        data.license = checkLicense(net.npm.license, projectLicense);
        data.name = net.npm.name || data.name;
        data.version = net.npm.version;
      }

      // Fill health from GitHub if not provided offline
      if (!data.health && net.github) {
        const hd = {
          lastCommitDate: net.github.pushed_at,
          openIssues: net.github.open_issues_count,
          stars: net.github.stargazers_count,
          forks: net.github.forks_count,
          lastReleaseDate: net.release,
        };
        // Compute issue response from fetched issues
        if (net.issues && net.issues.length > 0) {
          hd.issueResponseDays = computeMedianResponse(net.issues);
        }
        data.health = healthVerdict(hd);
      }

      // Fill name/version from GitHub if no npm
      if (!data.version && net.github) {
        data.name = net.repo || data.name;
      }

      if (net.errors.length > 0) data.errors.push(...net.errors);
    } catch (e) {
      data.errors.push(`network: ${e.message}`);
    }
  }

  // If no license data at all, mark unknown
  if (!data.license) {
    data.license = checkLicense(null, projectLicense);
  }

  // If no health data at all
  if (!data.health) {
    data.health = healthVerdict(null);
  }

  return data;
}

/**
 * Determine exit code: 0 = ok, 1 = fail.
 */
export function shouldFail(data) {
  if (data.license?.verdict === "incompatible") return true;
  if (data.health?.overall === "unhealthy") return true;
  return false;
}
