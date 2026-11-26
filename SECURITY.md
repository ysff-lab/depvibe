# Security Policy

## Supported Versions

Only the latest `1.x` release receives security updates.

| Version | Supported |
|---------|-----------|
| 1.x     | yes       |
| < 1.0   | no        |

## Reporting a Vulnerability

Please do not open a public issue for security vulnerabilities.

Report privately to the maintainers. Acknowledgement within 72 hours.

`depvibe` makes network requests to npm and GitHub. It does not store credentials. `GITHUB_TOKEN` is read from env and never logged.

## Scope

- Network request handling (SSRF, injection)
- License matrix correctness (wrong verdict = real harm)
- Any crash on untrusted input (package names, JSON data)
