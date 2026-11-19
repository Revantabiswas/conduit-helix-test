# Evidence Manifest — Unit tests + coverage — story-1.1

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
| 1 | `npx vitest run --config vitest.config.js` (baseline, clean worktree at base) | repo root | 0 |
| 2 | `npx vitest run --config vitest.src.config.js` (baseline, clean worktree at base) | repo root | 0 |
| 3 | `npx vitest run --config vitest.src.config.js tests/unit/backend --coverage --coverage.include='backend/{index.js,routes/version.js}' --coverage.reportsDirectory=reports/unit-test-evidence/story-1.1/coverage ...` | repo root | 0 |
| 4 | `npx vitest run --config vitest.config.js` then `npx vitest run --config vitest.src.config.js` (full regression) | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| vitest | 4.1.11 |
| @vitest/coverage-v8 | ^4.1.11 (as declared) |
| node | v22.23.5 |

## Result
| Item | Value |
|---|---|
| Tests passed | 8/8 in tests/unit/backend/routes/version.test.js |
| Changed executable lines covered | 8/8 (100.0%) |
| Changed branches covered | 0/0 (the change adds no branch) |
| Threshold | 90.0% |
| Whole-file coverage (transparency only) | backend/routes/version.js 6/6 lines; backend/index.js 32/34 lines (uncovered: the pre-existing database-connect catch lines 23 and 30) |
| Baseline pass/fail | legacy 12/12, src 143/143, 0 failures |
| Post-change pass/fail | legacy 12/12, src 157/157 (+14 new tests: 8 unit, 6 API), 0 failures |
| New failures | none |
| Test placement verdict | PASS (3 test files, all correctly placed) |

## Artifacts
| File | What it is |
|---|---|
| baseline-regression.log | whole suite at the base commit in a clean worktree, after repairing the sqlite3 native binding |
| unit-test-run.log | the coverage run of the unit tests |
| coverage/ | lcov.info, coverage-summary.json, HTML report, changed-lines-coverage.json |
| full-regression.log | whole suite after the change |
| test-placement-check.log | placement rule check |

## Exceptions and notes
- The first baseline was captured before the sandbox's sqlite3 native binary was repaired (it needs GLIBC 2.38; the sandbox has 2.36 and no compiler). It showed 14 failing src test files, all caused by that missing binary. The binary was replaced by the upstream prebuilt v5.1.7 napi-v6 build (environment only, no repository file changed) and the baseline was re-captured at the same base commit, so baseline and post-change ran in the same environment.
- Self-healing attempts: none needed (SH-LOOP-1 0/3).
