# depvibe

**Zero-dependency CLI: "should I depend on this?" — license compatibility + project health in one command.**

Before you add a dependency, two questions matter: is its license compatible with yours? Is the project alive and maintained? `depvibe` answers both in seconds.

```sh
$ depvibe check express
depvibe — express (4.19.2)

LICENSE
  COMPATIBLE  Apache-2.0
  Apache-2.0 is permissive and compatible with MIT.

HEALTH
  HEALTHY  active / responsive
  Last commit: 12 days ago. Active.
  Median response: 3 days. Responsive.
  Last release: 45 days ago
  Open issues: 12  Stars: 65000  Forks: 11000

VERDICT
  DEPEND. Safe to use.
```

## Why

Existing tools answer half the question. `license-checker` checks licenses but not health. `npm audit` checks security but not maintenance. Nothing combines "can I legally use this?" and "will this be maintained?" into one verdict. `depvibe` does.

## Install

```sh
npx depvibe check express     # run without installing
# or
npm install -g depvibe
```

No dependencies. Requires Node.js >= 18.

## Usage

```sh
depvibe check <package>              # network: fetches npm + GitHub
depvibe check <package> --json        # machine-readable
depvibe check <package> --fail        # exit 1 if incompatible or unhealthy
depvibe check --license MIT --data health.json  # offline mode
depvibe check <pkg> --offline        # skip network
depvibe check <pkg> --no-color       # plain output, no ANSI colors
```

### Offline mode

Pass a license string and/or a health JSON file. No network needed. Useful in CI or air-gapped environments.

```json
// health.json
{
  "lastCommitDate": "2026-11-01T00:00:00Z",
  "issueResponseDays": 5,
  "openIssues": 3,
  "stars": 100
}
```

```sh
depvibe check --license Apache-2.0 --data health.json
```

## What it checks

### License compatibility
Can an MIT project depend on this license? Three verdicts:
- **COMPATIBLE** — safe to depend on
- **CONDITIONAL** — linking ok, but modifications to that code stay under its license
- **INCOMPATIBLE** — copyleft/proprietary; would force your project to change license
- **UNKNOWN** — unrecognized; manual review needed

Supported licenses (12): MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, GPL-2.0, GPL-3.0, LGPL-2.1, LGPL-3.0, MPL-2.0, AGPL-3.0, Unlicense, CC0-1.0, 0BSD, BSL-1.1, SSPL-1.0, and common aliases.

### Project health
- **Alive**: active (<90d), maintenance (90-365d), stale (365-730d), dead (>730d)
- **Responsive**: responsive (<14d median), slow (14-30d), unresponsive (>30d)
- Signals: last commit, last release, open issues, stars, forks

## Environment

```sh
GITHUB_TOKEN=ghp_... depvibe check express   # 5000 req/hr instead of 60
NO_COLOR=1 depvibe check express             # disable colors (https://no-color.org/)
```

## Use in CI

```yaml
# .github/workflows/ci.yml
- run: npx depvibe check <your-key-dep> --fail
```

## Programmatic API

```js
import { runCheck, shouldFail } from "depvibe";

const data = await runCheck({ pkg: "express", projectLicense: "MIT" });
console.log(data.license.verdict, data.health.overall);
if (shouldFail(data)) process.exit(1);
```

## Offline API

```js
import { checkLicense, healthVerdict } from "depvibe";

const lic = checkLicense("Apache-2.0", "MIT");
const health = healthVerdict({ lastCommitDate: "2026-11-01", issueResponseDays: 5 });
```

## Run the tests

```sh
npm test
```

## Roadmap (v2)
- Whole dependency tree scan (`depvibe scan package.json`)
- README badge (health + license status)
- More license rules (EPL, CDDL, EUPL, etc.)
- Caching layer for network results

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bugs and ideas: open an issue.

## License

MIT. See [LICENSE](LICENSE).

## Disclaimer

License compatibility is a heuristic based on SPDX identifiers, not legal advice. Consult a lawyer for licensing decisions.
