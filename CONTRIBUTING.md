# Contributing to depvibe

Thanks for helping. The project is zero-dependency and deliberately easy to contribute to.

## Ground rules

- Be kind. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
- Zero runtime dependencies. A new feature must not pull in packages.
- Keep `node --test` green. Add tests for anything you add.
- The license matrix is the core. Changes to it need extra review.

## Setup

```sh
git clone https://github.com/YOUR_USERNAME/depvibe.git
cd depvibe
node bin/depvibe.js check express   # try it
npm test                           # run tests
```

Requires Node.js >= 18. No build step.

## Project layout

```
bin/depvibe.js       CLI entry point
src/license.js       compatibility matrix + checkLicense (core logic)
src/health.js        health signals + verdicts
src/network.js       npm/GitHub fetchers
src/report.js        terminal/JSON formatting
src/index.js         orchestration + exports
test/                node:test suites
```

## Adding a license to the matrix

1. Find the SPDX identifier.
2. Classify: PERMISSIVE, FILE_COPYLEFT, STRONG_COPYLEFT, or NON_OSI.
3. Add to the correct Set in `src/license.js`.
4. Add a test in `test/license.test.js`.
5. Update the supported-licenses list in `README.md`.

## Adding a health signal

1. Add the signal to `healthVerdict()` in `src/health.js`.
2. Add a test.
3. Update README.

## Style

- ESM, `node:`-prefixed builtins.
- Small pure functions. Side effects only in `bin/` and `network.js`.
- Commit messages: short imperative subject. Conventional Commits appreciated.

## Pull requests

- One concern per PR.
- Fill in the PR template.
- CI must pass. Add tests.
- Don't bump `version` in feature PRs.

## Reporting bugs / ideas

Open an issue using the templates. Include Node version, OS, the package you checked, and expected vs actual output.
