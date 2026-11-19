# Evidence Manifest — Behavioural B3 (epic scope) — story-1.1

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
| 1 | `npx cucumber-js --config cucumber.mjs spec/behavior.feature --format json:reports/behavior-test-evidence/story-1.1/b3/behavior-test-report.json` | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| @cucumber/cucumber | 13.2.1 |
| node | v22.23.5 |

## Result
| Item | Value |
|---|---|
| Tier | b3 |
| Feature files in scope | spec/behavior/story-1.1.feature + spec/behavior.feature (no cross-unit journeys, by design) |
| Scenarios passed | 8/8 |
| @AC tags executed | 5/5 (AC-1, AC-2, AC-3, AC-4, AC-5) |
| Containerised | no — podman is not installed in this environment (`command -v podman` returns nothing); native run, the one permitted exception |
| Image ref + digest | none (no container run) |

## Artifacts
| File | What it is |
|---|---|
| behavior-test-run.log | raw cucumber output |
| behavior-test-report.json | cucumber JSON report |

## Exceptions and notes
- tests/behavior/steps also holds step files from an earlier archived cycle. They load unchanged and do not interfere; the new steps are in tests/behavior/steps/story-1.1-version-endpoint_steps.js (a distinct name so the earlier story-1.1_steps.js is not overwritten).
- The step run starts the real backend/index.js as a child process and stops it afterwards.
- B3 runs because Story 1.1 is the only and therefore the last work unit; spec/behavior.feature intentionally has no scenarios.
