# Evidence Manifest — Static eval D1-D7 — story-1.1

| Field | Value |
|---|---|
| Work unit | Story 1.1 — Confirm the deployed backend version with one request |
| Branch / head | story/KAN-28-1.1-confirm-deployed-backend-version @ 680cb05 (uncommitted working tree) · base 680cb05 |
| Generated | 2026-11-19T13:27:43Z |
| Forge version | 1.0 |
| Status | PASS |

## Commands run
| # | Command | Working directory | Exit code |
|---|---|---|---|
| 1 | `npx eslint backend tests/unit/backend tests/api/version.route.test.js tests/behavior/steps/story-1.1-version-endpoint_steps.js --format json` (D1, D6) | repo root | 1 (13 pre-existing findings, 0 new) |
| 2 | `semgrep --config /tmp/semgrep-rules/javascript --metrics=off --json <same paths>` (D3) | repo root | 0 |
| 3 | `npm audit --json` (D4) | repo root | 1 (pre-existing, unchanged) |
| 4 | `npx license-checker --start . --json --production` (D5) | repo root | 0 |
| 5 | `gitleaks detect --source . --no-git --config .gitleaks.toml --report-format json --redact` (D7) | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| eslint | 9.39.5 (repo config eslint.config.js, used as-is; complexity rule at 12) |
| semgrep | 1.127.0, rules: official semgrep-rules repo (javascript/, commit a5ad171) |
| npm audit | npm 10.9.9 |
| license-checker | latest via npx |
| gitleaks | 8.21.2 (repo .gitleaks.toml, default ruleset) |

## Result
| Gate | Tool | Baseline findings | Post-change findings | NEW findings on changed files | Threshold | Status |
|---|---|---|---|---|---|---|
| D1 Lint | eslint | 13 | 13 | 0 | 0 delta | PASS |
| D2 Types | — | — | — | — | 0 | N/A — plain JavaScript, no type checker applies |
| D3 SAST | semgrep | 18 | 18 | 0 (0C / 0H / 0M) | 0C / 0H / 5M | PASS |
| D4 Deps | npm audit | 4C / 8H / 12M / 1L | 4C / 8H / 12M / 1L | 0 (lockfile unchanged) | 0C / 0H new | PASS |
| D5 Licences | license-checker | 78 packages, 0 disallowed | 78 packages, 0 disallowed | 0 | none disallowed | PASS |
| D6 Complexity | eslint complexity | 0 over 12 | 0 over 12 (changed code max 1) | 0 | 12 | PASS |
| D7 Secrets | gitleaks | 2 | 2 | 0 | 0 new | PASS |

## Artifacts
| File | What it is |
|---|---|
| eslint.json, complexity.json, semgrep.json, semgrep-delta.json, npm-audit.json, license-report.json, gitleaks.json, gitleaks-delta.json | post-change raw output and deltas |
| baseline/ | the pre-change output of the same tools (D1, D3, D4, D5, D6, D7) |

## Exceptions and notes
- semgrep's `--config auto` registry is unreachable from this sandbox (proxy returns 403), so the official semgrep-rules repository was cloned (reachable) and its javascript rule set used for both baseline and post-change, so both ran under identical rules.
- Pre-existing debt recorded, not fixed: 13 eslint errors in backend/, 4 critical and 8 high npm advisories, 2 gitleaks hits (an example Authorization header in an archived test plan and in this cycle's own test plan).
- The two baseline files for eslint and semgrep were scoped to backend/ (the package this story changes); post-change adds the story's new test files.
- D2: no tsconfig and no TypeScript in backend/, so no type checker applies.
