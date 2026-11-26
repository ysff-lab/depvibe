---
title: "Why I built a tool to check if you should depend on a package"
published: false
description: "License compatibility + project health in one CLI command. Zero dependencies."
tags: javascript, opensource, cli, node
---

## The problem

Every time I add a dependency, I ask two questions:

1. **Can I legally use this?** — Is its license compatible with mine?
2. **Will this be maintained?** — Is the project alive or dead?

Existing tools answer half the question. `license-checker` checks licenses but not health. `npm audit` checks security but not maintenance. Nothing combines both into one verdict.

So I built **depvibe**.

## What it does

```sh
$ npx depvibe check express
```

```
depvibe — express (5.3.0)

LICENSE
  COMPATIBLE  MIT
  MIT is permissive and compatible with MIT.

HEALTH
  HEALTHY  active / responsive
  Last commit: 6 days ago. Active.
  Median response: 1.6 days. Responsive.
  Last release: 48 days ago
  Open issues: 267  Stars: 69756

VERDICT
  DEPEND. Safe to use.
```

One command. Two verdicts. Clear answer.

## The license matrix

depvibe checks 12 common licenses against your project's license:

| License | Verdict (vs MIT) |
|---------|-----------------|
| MIT, BSD, ISC, Apache-2.0 | Compatible |
| MPL-2.0, LGPL, EPL | Conditional (file-level copyleft) |
| GPL-2/3, AGPL, CC-BY-SA | Incompatible (strong copyleft) |
| BSL, SSPL | Incompatible (not open source) |

It handles aliases too: "Apache 2.0", "gpl-3", "unlicense" all normalize correctly.

## Health signals

- **Alive**: active (<90d), maintenance (90-365d), stale (365-730d), dead (>730d)
- **Responsive**: responsive (<14d median), slow (14-30d), unresponsive (>30d)
- Signals: last commit, last release, open issues, stars, forks

## Offline mode

No network? No problem.

```sh
depvibe check --license Apache-2.0 --data health.json
```

Pass a license string and a health JSON file. Zero network calls. Works in air-gapped CI.

## Try it

```sh
npx depvibe check express
npx depvibe check lodash
npx depvibe check chalk
```

## What's next

- Whole dependency tree scan (`depvibe scan package.json`)
- README badge
- More license rules
- PyPI support

## Contributing

The repo has 5 "good first issue" labels. If you want to contribute, check them out:

https://github.com/ysff-lab/depvibe/issues

Zero dependencies. Node.js 18+. MIT license.

## Links

- GitHub: https://github.com/ysff-lab/depvibe
- npm: (coming soon)
