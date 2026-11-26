#!/usr/bin/env node
import { runCheck, shouldFail } from "../src/index.js";
import { formatReport, formatJson } from "../src/report.js";

const args = process.argv.slice(2);

function help() {
  console.log(`
depvibe — "should I depend on this?"

Usage:
  depvibe check <package>                    check a package (network + offline)
  depvibe check <pkg> --offline              skip network, offline only
  depvibe check --license <id> --data <file>  offline: check license + health data
  depvibe --help                             show this help

Options:
  --json              machine-readable JSON output
  --fail              exit 1 if incompatible or unhealthy
  --license <id>      dependency license (offline mode, default: MIT)
  --project <id>      your project license (default: MIT)
  --data <file>       path to health JSON file (offline mode)
  --offline           skip network fetch
  --no-color          disable colored output
  -h, --help          show this help

Examples:
  depvibe check express
  depvibe check lodash --json
  depvibe check left-pad --fail
  depvibe check --license Apache-2.0 --data ./health.json
  depvibe check express --project Apache-2.0

Environment:
  GITHUB_TOKEN   optional, raises GitHub rate limit from 60 to 5000/hr
  NO_COLOR       if set (non-empty), disable colored output
`.trim());
  process.exit(0);
}

let command = null;
let pkg = null;
let json = false;
let fail = false;
let depLicense = null;
let projectLicense = "MIT";
let dataFile = null;
let offline = false;
let noColor = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "check") command = "check";
  else if (a === "--help" || a === "-h") help();
  else if (a === "--json") json = true;
  else if (a === "--fail") fail = true;
  else if (a === "--offline") offline = true;
  else if (a === "--no-color") noColor = true;
  else if (a === "--license") depLicense = args[++i];
  else if (a === "--project") projectLicense = args[++i];
  else if (a === "--data") dataFile = args[++i];
  else if (!a.startsWith("-")) {
    if (!pkg) pkg = a;
  }
}

if (!command && args.length === 0) help();
if (command === "check" && !pkg && !dataFile && !depLicense) {
  console.error("Error: provide a package name or --data/--license.");
  process.exit(2);
}

// Load health data file
let healthData = null;
if (dataFile) {
  try {
    const { readFileSync } = await import("node:fs");
    healthData = JSON.parse(readFileSync(dataFile, "utf8"));
  } catch (e) {
    console.error(`Error reading data file: ${e.message}`);
    process.exit(2);
  }
}

const opts = {
  pkg: pkg || null,
  license: depLicense || null,
  healthData,
  projectLicense,
  network: !offline && !!pkg,
};

const data = await runCheck(opts);
if (noColor) data.useColor = false;

if (json) {
  console.log(formatJson(data));
} else {
  console.log(formatReport(data));
}

if (fail && shouldFail(data)) process.exit(1);
process.exit(0);
