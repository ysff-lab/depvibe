/**
 * License compatibility checker for depvibe.
 *
 * Answers: "Can an MIT project depend on a package with license X?"
 *
 * Rules are based on SPDX license identifiers and OSI classification.
 * This is a heuristic, not legal advice. See README.
 *
 * Three verdicts:
 *   compatible   — safe to depend on
 *   conditional  — linking ok, but modifications to that code stay under its license
 *   incompatible — copyleft/proprietary; would force your project to change license
 *   unknown      — unrecognized license; manual review needed
 */

// Normalized SPDX-ish identifiers → category
const PERMISSIVE = new Set([
  "MIT", "BSD-2-Clause", "BSD-3-Clause", "ISC", "Apache-2.0",
  "Unlicense", "CC0-1.0", "0BSD", "Zlib", "WTFPL", "BlueOak-1.0.0",
  "PostgreSQL", "Artistic-2.0", "Python-2.0", "X11", "NCSA",
  "CC-BY-4.0", "CC-BY-3.0", "OpenSSL", "bzip2-1.0.6", "curl",
  "HPND", "ICU", "ImageMagick", "Info-ZIP", "JSON", "MIT-0",
  "MulanPSL-2.0", "Naumen", "NTP", "OFL-1.1", "PHP-3.0", "PHP-3.01",
  "PostgreSQL", "Python-2.0", "Ruby", "Saxpath", "SGI-B-2.0",
  "Spencer-86", "Spencer-94", "Spencer-99", "SSH-OpenSSH", "SSH-short",
  "SunPro", "TCP-wrappers", "TMate", "TORQUE-1.1", "TU-Berlin-1.0",
  "TU-Berlin-2.0", "UCL-1.0", "Unicode-DFS-2015", "Unicode-DFS-2016",
  "Unicode-TOU", "Unlicense", "Vim", "VOSTROM", "W3C", "W3C-19980720",
  "W3C-20150513", "Watcom-1.0", "X11", "Xerox", "XFree86-1.1",
  "XSkat", "Zed", "Zend-2.0", "Zimbra-1.3", "Zimbra-1.4", "Zlib",
  "zlib-acknowledgement", "ZPL-1.1", "ZPL-2.0", "ZPL-2.1",
]);

const FILE_COPYLEFT = new Set([
  "MPL-2.0", "LGPL-2.1", "LGPL-2.1-or-later", "LGPL-3.0", "LGPL-3.0-or-later",
  "EPL-1.0", "EPL-2.0", "CDDL-1.0", "CDDL-1.1", "EUPL-1.1", "EUPL-1.2",
  "OSL-3.0", "APSL-2.0", "APL-1.0", "CPL-1.0", "IPL-1.0", "RPL-1.1",
  "RPL-1.5", "RSCPL", "SimPL-2.0", "Sleepycat", "SPL-1.0", "wxWindows",
]);

const STRONG_COPYLEFT = new Set([
  "GPL-2.0", "GPL-2.0-only", "GPL-2.0-or-later", "GPL-3.0", "GPL-3.0-only",
  "GPL-3.0-or-later", "AGPL-3.0", "AGPL-3.0-only", "AGPL-3.0-or-later",
  "CC-BY-SA-4.0", "CC-BY-SA-3.0", "CC-BY-SA-2.5", "CC-BY-SA-2.0",
  "ODbL-1.0", "GFDL-1.3", "GFDL-1.2", "GFDL-1.1",
]);

const NON_OSI = new Set([
  "BSL-1.1", "BUSL-1.1", "SSPL-1.0", "Elastic-2.0", "Prosperity-3.0.0",
  "PolyForm-Noncommercial-1.0.0", "PolyForm-Small-Business-1.0.0",
  "CC-BY-NC-4.0", "CC-BY-NC-3.0", "CC-BY-NC-2.5", "CC-BY-NC-2.0",
  "CC-BY-NC-SA-4.0", "CC-BY-NC-ND-4.0", "CC-BY-ND-4.0",
  "Proprietary", "Commercial", "LicenseRef-Proprietary",
]);

/**
 * Normalize a raw license string to an SPDX identifier.
 * Handles common variations: "MIT License", "Apache 2.0", "GPL-3.0", etc.
 */
export function normalizeLicense(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();

  // Direct SPDX match (case-insensitive)
  const direct = raw.trim();
  if (PERMISSIVE.has(direct) || FILE_COPYLEFT.has(direct) ||
      STRONG_COPYLEFT.has(direct) || NON_OSI.has(direct)) {
    return direct;
  }

  // Common aliases
  const aliases = {
    "mit": "MIT", "mit license": "MIT", "mit licence": "MIT",
    "apache 2.0": "Apache-2.0", "apache-2.0": "Apache-2.0",
    "apache 2": "Apache-2.0", "apache license 2.0": "Apache-2.0",
    "apache license, version 2.0": "Apache-2.0",
    "bsd": "BSD-3-Clause", "bsd-2": "BSD-2-Clause", "bsd-3": "BSD-3-Clause",
    "bsd 2-clause": "BSD-2-Clause", "bsd 3-clause": "BSD-3-Clause",
    "isc": "ISC", "isc license": "ISC",
    "gpl-2": "GPL-2.0", "gpl-2.0": "GPL-2.0", "gpl v2": "GPL-2.0",
    "gpl-3": "GPL-3.0", "gpl-3.0": "GPL-3.0", "gpl v3": "GPL-3.0",
    "gpl": "GPL-3.0",
    "agpl": "AGPL-3.0", "agpl-3": "AGPL-3.0", "agpl-3.0": "AGPL-3.0",
    "lgpl": "LGPL-3.0", "lgpl-2.1": "LGPL-2.1", "lgpl-3.0": "LGPL-3.0",
    "mpl": "MPL-2.0", "mpl-2.0": "MPL-2.0", "mozilla public license 2.0": "MPL-2.0",
    "unlicense": "Unlicense", "unlicensed": "Unlicense", "public domain": "Unlicense",
    "cc0": "CC0-1.0", "cc0-1.0": "CC0-1.0",
    "0bsd": "0BSD", "zero-clause bsd": "0BSD",
    "zlib": "Zlib", "zlib license": "Zlib",
    "wtfpl": "WTFPL",
    "bsl": "BSL-1.1", "business source license": "BSL-1.1", "busl": "BSL-1.1",
    "sspl": "SSPL-1.0", "server side public license": "SSPL-1.0",
    "eupl": "EUPL-1.2",
    "cc-by-sa": "CC-BY-SA-4.0", "cc by-sa 4.0": "CC-BY-SA-4.0",
    "cc-by-4.0": "CC-BY-4.0", "cc by 4.0": "CC-BY-4.0",
    "proprietary": "Proprietary", "commercial": "Proprietary",
    "none": null, "": null,
  };

  if (aliases[s]) return aliases[s];

  // SPDX OR expression: "MIT OR Apache-2.0" → pick the most permissive? No, return as-is for now
  if (s.includes(" or ") || s.includes(" and ") || s.includes("/")) {
    return raw.trim(); // leave complex expressions for manual review
  }

  // Try case-insensitive match against known sets
  const upper = raw.trim().toUpperCase();
  for (const set of [PERMISSIVE, FILE_COPYLEFT, STRONG_COPYLEFT, NON_OSI]) {
    for (const id of set) {
      if (id.toUpperCase() === upper) return id;
    }
  }

  return null; // unknown
}

/**
 * Check if a dependency license is compatible with an MIT project.
 *
 * @param {string} depLicense - raw or SPDX license string of the dependency
 * @param {string} [projectLicense="MIT"] - SPDX identifier of the consuming project
 * @returns {{ verdict: "compatible"|"conditional"|"incompatible"|"unknown", reason: string, normalized: string|null }}
 */
export function checkLicense(depLicense, projectLicense = "MIT") {
  const normalized = normalizeLicense(depLicense);

  if (!normalized) {
    return {
      verdict: "unknown",
      reason: `Unrecognized license "${depLicense}". Manual review required.`,
      normalized: null,
    };
  }

  // Non-OSI / proprietary
  if (NON_OSI.has(normalized)) {
    return {
      verdict: "incompatible",
      reason: `${normalized} is not an open-source license. Cannot depend on it in an open-source project.`,
      normalized,
    };
  }

  // Strong copyleft → incompatible with permissive project
  if (STRONG_COPYLEFT.has(normalized)) {
    if (projectLicense === "MIT" || PERMISSIVE.has(projectLicense)) {
      return {
        verdict: "incompatible",
        reason: `${normalized} is strong copyleft. Depending on it would require your entire project to be ${normalized}.`,
        normalized,
      };
    }
    // GPL project depending on GPL/AGPL → compatible (same family)
    if (normalized.startsWith("GPL") && projectLicense.startsWith("GPL")) return compatible(normalized, "Same GPL family.");
    if (normalized.startsWith("AGPL") && projectLicense.startsWith("AGPL")) return compatible(normalized, "Same AGPL family.");
    return {
      verdict: "incompatible",
      reason: `${normalized} is strong copyleft and incompatible with ${projectLicense}.`,
      normalized,
    };
  }

  // File-level copyleft → conditional
  if (FILE_COPYLEFT.has(normalized)) {
    return {
      verdict: "conditional",
      reason: `${normalized} is file-level copyleft. You can link to it, but modifications to its files must stay ${normalized}.`,
      normalized,
    };
  }

  // Permissive → compatible
  if (PERMISSIVE.has(normalized)) {
    return {
      verdict: "compatible",
      reason: `${normalized} is permissive and compatible with ${projectLicense}.`,
      normalized,
    };
  }

  // Complex SPDX expression (OR/AND)
  if (normalized.includes(" OR ") || normalized.includes(" AND ") || normalized.includes("/")) {
    return {
      verdict: "unknown",
      reason: `Complex SPDX expression "${normalized}". Manual review required.`,
      normalized,
    };
  }

  return {
    verdict: "unknown",
    reason: `License "${normalized}" not in compatibility database. Manual review required.`,
    normalized,
  };
}

function compatible(normalized, reason) {
  return { verdict: "compatible", reason, normalized };
}

/**
 * Bulk check: given a list of {name, license} objects, return verdicts.
 */
export function checkLicenses(deps, projectLicense = "MIT") {
  return deps.map((dep) => ({
    name: dep.name,
    license: dep.license,
    ...checkLicense(dep.license, projectLicense),
  }));
}

/**
 * Summary: count verdicts.
 */
export function licenseSummary(results) {
  const counts = { compatible: 0, conditional: 0, incompatible: 0, unknown: 0 };
  for (const r of results) counts[r.verdict]++;
  return counts;
}
