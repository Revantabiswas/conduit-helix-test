# Code Review - Story 1.1: Confirm the deployed backend version with one request

**Date**: 2026-11-19
**Reviewed By**: REVIEWER (forge)
**Review Number**: 1
**Review Mode**: INITIAL_REVIEW
**Review Target**: Story 1.1
**Status**: APPROVED WITH COMMENTS
**Tracker ID**: KAN-28

## Review Summary
**Components Reviewed**: backend/routes/version.js (new), backend/index.js (2 lines), tests/unit/backend/routes/version.test.js, tests/api/version.route.test.js, tests/behavior/steps/story-1.1-version-endpoint_steps.js
**Stories in Scope**: 1.1
**Tests Reviewed**: Yes — statically; suite NOT re-run  **Coverage**: 100.0% of changed lines (from the Unit Test & Coverage gate — not re-measured)
**API & Contract Tests**: Applicable — 1/1 endpoints checklist-complete (from the API & Contract Testing Gate — not re-run)
**Static Eval Gate (D1–D7)**: PASS (6 of 7 ran, D2 N/A) (from the Static Eval Gate — not re-run; cites `reports/eval-evidence/story-1.1/eval-summary.md`)
**Security Baseline (SECURITY-01…16, diff-scoped)**: 16/16 checked · 4 compliant · 10 N/A · Findings: 0 Blocker / 0 High (blocking) · 1 Medium / 1 Low (advisory) · 2 pre-existing (not this change) → report: `reports/code-security-reviews/story-1.1-security-review-v1.md`
**Judge Gates (blocking — Phase 3.5; never findings)**: J1 Architecture 1.00 (min 0.85) PASS · J2 Security 1.00 (min 0.85) PASS
**Overall Assessment**: All five acceptance criteria and all nine mapped requirements are met and each is exercised by a passing test. The change is minimal (one new router file, two lines in backend/index.js). Two non-blocking security advisories and one specification amendment are recorded below.

## AC & Requirements Verification

### Story 1.1: Confirm the deployed backend version with one request
| # | AC / Requirement | Verdict | Evidence / Gap |
|---|------------------|---------|----------------|
| AC-1 | GET /api/version returns 200 JSON with exactly name and version | Met | `backend/routes/version.js:7-9`; tests/unit/backend/routes/version.test.js:43, tests/api/version.route.test.js |
| AC-2 | Version equals package.json, read at startup, startup fails if unreadable | Met | `backend/routes/version.js:2`; test at tests/unit/backend/routes/version.test.js:51 and :81 |
| AC-3 | Public route, mounted before the catch-all 404 | Met | `backend/index.js:39` before `backend/index.js:40`; test :59 and :127 |
| AC-4 | Unit test covers AC-1 to AC-3 and runs under vitest | Met | tests/unit/backend/routes/version.test.js (8 tests); run with vitest.src.config.js. AC text was amended before coding to the framework-mandated location (see Notes) |
| AC-5 | No new dependency; own router module; existing routes unchanged | Met | package.json files and lockfile diff empty; `backend/routes/version.js` mounted at `backend/index.js:39`; full regression 0 new failures |
| REQ-F-01 | exact response body | Met | AC-1 |
| REQ-F-02 | version from package.json, no hardcoded copy | Met | AC-2 |
| REQ-F-03 | public route before catch-all | Met | AC-3 |
| REQ-F-04 | fail at startup if package.json unreadable | Met | tests/unit/backend/routes/version.test.js:81 |
| REQ-F-05 | unit test | Met | AC-4 |
| REQ-NF-01 | no new dependency | Met | AC-5 |
| REQ-NF-02 | existing conventions (CommonJS router under backend/routes mounted under /api) | Met | `backend/routes/version.js`, `backend/index.js:14,39` |
| REQ-NF-03 | only name and version exposed | Met | `backend/routes/version.js:8` |
| REQ-NF-04 | no per-request I/O | Met | version read once at `backend/routes/version.js:2` |

## Issues Found
No issues — all acceptance criteria and requirements verified as Met; diff is clean against SECURITY-01…16 (no blocking finding).

## Security — Advisory (non-blocking)
- SEC-001 (Low, SECURITY-09): public version disclosure, accepted in the Epic. `backend/routes/version.js:7-9`.
- SEC-002 (Medium, SECURITY-11): no rate limiting on the new public route; Epic puts it out of scope; the whole API is unthrottled. **Human decision recommended.** `backend/index.js:39`.
- Pre-existing, not this change: CORS wildcard (`backend/index.js:17`), no security-header middleware. Recommend /raise-defect.

## Notes (informational, not findings)
- **Spec amendment**: AC-4 / REQ-F-05 originally put the unit test under backend/ and run via npm test. The framework's hard placement rule requires tests/unit/, and npm test (jsdom config) does not include it. AC-4, REQ-F-05, the .feature scenario, TC-API-08, architecture.md and the Jira description were amended together before coding and the change was logged.
- **Environment repair**: the sandbox cannot load sqlite3's prebuilt binary (needs GLIBC 2.38). The prebuilt v5.1.7 binary was dropped into node_modules (untracked) and the baseline re-captured. Podman is not installed, so behaviour tiers ran natively.
- **Jira**: the project has no "In Development" or "Ready for Development" status; In Progress and To Do were used as the nearest equivalents. Assignee could not be resolved (lookup for "admin" returned no account).

## Issue Summary
| # | ID | Severity | AC/Requirement or SECURITY rule | File | Status |
|---|-----|----------|----------------|------|--------|
| — | none | — | — | — | — |

**Counts**: Blockers: 0 | High: 0 — of which security: 0 Blocker / 0 High · Advisory (non-blocking): 2

## Approval Status
**Decision**: APPROVED WITH COMMENTS
**Reason**: every AC and requirement is Met, both judge gates pass, no blocking finding; the two advisories need a human decision but do not block.
