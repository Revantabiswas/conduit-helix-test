# Security Test Steps — KAN-28 GET /api/version

**Purpose**: confirm the deliberately public endpoint exposes nothing beyond name and version and adds no supply-chain risk.
**Scope**: AC-1, AC-3, AC-5. Security Baseline: SECURITY-05, SECURITY-08 (documented public exception), SECURITY-10, SECURITY-15.

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/KAN-25-backend-version-endpoint` |
| This story's PR | Not yet raised (story code is generated later via dev-implement); execute after the story PR has merged into the epic branch |
| Confirm the story is in the build | `git log --oneline | grep KAN-28` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | `http://localhost:3001` (backend default per spec/plans/knowledge-hub-deep-dive.md; TO CONFIRM if PORT is overridden locally) |
| Local services that must be up | The backend, with its database as the project docs describe |
| Test data / accounts to seed | none |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log functional failures against a system that never started.

### TC-SEC-01 — Response discloses only name and version
| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03 (SECURITY-15) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | none |

**Steps**
1. Run `curl -i http://localhost:3001/api/version`.
2. Read all response headers and the body.

**Expected result**
- Body contains only `name` and `version`; no commit hash, build time, environment, host path or dependency list.
- No stack trace or internal path appears in any header or body.

**Pass/Fail criteria**: PASS if nothing beyond name and version is disclosed in the body; FAIL otherwise.
**Cleanup**: none.

### TC-SEC-02 — Route is intentionally public; other protected routes are unaffected
| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-03 (SECURITY-08 documented exception) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | none |

**Steps**
1. Run `curl -i http://localhost:3001/api/version` with no credentials.
2. Run `curl -i http://localhost:3001/api/user` with no credentials.

**Expected result**
- Step 1 returns 200.
- Step 2 does not return the user data of any account (it is not made public by this change; record the exact status it returns and compare with the pre-change branch, TO CONFIRM baseline).

**Pass/Fail criteria**: PASS if /api/version is 200 and /api/user exposes no user data; FAIL otherwise.
**Cleanup**: none.

### TC-SEC-03 — Input is ignored and not reflected (negative)
| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03 (SECURITY-05) |
| **Type** | Security |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | Query string `?name=<script>alert(1)</script>&version=evil` |

**Steps**
1. Run `curl -i "http://localhost:3001/api/version?name=%3Cscript%3Ealert(1)%3C/script%3E&version=evil"`.
2. Run `curl -i -X POST http://localhost:3001/api/version`.

**Expected result**
- Step 1 returns the normal body `{"name":"conduit","version":"<V>"}` and does not echo any supplied value.
- Step 2 does not return the version body with 200 (only GET is supported); it returns an error status such as 404.

**Pass/Fail criteria**: PASS if the input is not reflected and POST is not served as a success; FAIL otherwise.
**Cleanup**: none.

### TC-SEC-04 — No new dependency is introduced
| Field | Value |
|-------|-------|
| **Traces to** | AC-5 / REQ-NF-01 (SECURITY-10) |
| **Type** | Security |
| **Priority** | P1 |
| **Preconditions** | Git history of the epic branch available |
| **Test data** | none |

**Steps**
1. Find the story's merge or commits with `git log --oneline | grep KAN-28`.
2. Show the changes to dependency manifests: `git diff <base-commit-before-story> <story-merge-commit> -- package.json backend/package.json package-lock.json`.

**Expected result**
- The diff is empty: no dependency or devDependency was added, removed or changed.

**Pass/Fail criteria**: PASS if the dependency sections are unchanged; any dependency change is a FAIL.
**Cleanup**: none.
