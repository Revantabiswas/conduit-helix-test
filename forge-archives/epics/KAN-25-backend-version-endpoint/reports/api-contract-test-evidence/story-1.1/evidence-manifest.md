# Evidence Manifest — API & contract — story-1.1

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
| 1 | `npx vitest run --config vitest.src.config.js tests/api/version.route.test.js --reporter=verbose --reporter=json --outputFile.json=reports/api-contract-test-evidence/story-1.1/api-contract-test-report.json` | repo root | 0 |

## Tools
| Tool | Version |
|---|---|
| vitest | 4.1.11 |

## Result
| Endpoint | Functional | Status codes | Auth 401/403 | Error shape | Request validation | Response schema |
|---|---|---|---|---|---|---|
| GET /api/version | Pass | Pass (200; unknown path 404; non-GET not 200) | Pass — public by design: 200 with no token and with an invalid token, never 401/403 | Pass (404 body `{errors:{body:["Not found"]}}`) | Pass (query ignored, not reflected) | Pass (exactly two string fields) |

6/6 tests passed against the real backend/index.js app.

## Artifacts
| File | What it is |
|---|---|
| api-contract-test-run.log | raw runner output |
| api-contract-test-report.json | vitest JSON report |

## Exceptions and notes
None.
