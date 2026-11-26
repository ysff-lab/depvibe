# Changelog

All notable changes documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-26

### Added
- Initial release.
- `depvibe check <pkg>`: license compatibility + project health in one command.
- Offline mode: `--license` + `--data` file, no network.
- 12-license compatibility matrix (MIT, Apache-2.0, BSD, ISC, GPL, LGPL, MPL, AGPL, Unlicense, CC0, BSL, SSPL).
- Health signals: last commit, open issues, median issue response, last release, stars, forks.
- Alive verdicts: active, maintenance, stale, dead.
- Responsive verdicts: responsive, slow, unresponsive.
- `--json` and `--fail` for CI.
- Optional `GITHUB_TOKEN` for higher rate limits.
- Programmatic API: `runCheck`, `shouldFail`, `checkLicense`, `healthVerdict`.
- Zero runtime dependencies. Node.js >= 18.
- Tests via `node --test`. GitHub Actions CI.

[1.0.0]: https://github.com/ysff-lab/depvibe/releases/tag/v1.0.0
