# API Test Steps — KAN-28 GET /api/version

**Purpose**: manually verify the public version endpoint of the locally running backend.
**Scope**: AC-1 to AC-5 of Story 1.1 (REQ-F-01..05, REQ-NF-01..04).

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

Expected version value below is written as `<V>`: the "version" field of backend/package.json in the checked-out branch (1.0.0 at the time of writing).

### TC-API-01 — Version request returns name and version
| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-01 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Locally built backend running at the System Under Test URL |
| **Test data** | none |

**Steps**
1. Run `curl -i http://localhost:3001/api/version`.

**Expected result**
- Status line is `HTTP/1.1 200`.
- A `Content-Type` header containing `application/json`.
- Body is exactly `{"name":"conduit","version":"<V>"}`.

**Pass/Fail criteria**: PASS if status, content type and body all match; anything else is a FAIL.
**Cleanup**: none.

### TC-API-02 — Response has exactly two fields
| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | none |

**Steps**
1. Run `curl -s http://localhost:3001/api/version` and inspect the JSON keys.

**Expected result**
- Exactly the keys `name` and `version`, both strings; no commit hash, build or other field.

**Pass/Fail criteria**: PASS if exactly those two keys; any extra or missing key is a FAIL.
**Cleanup**: none.

### TC-API-03 — Version matches package.json
| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-02 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running from the checked-out branch |
| **Test data** | none |

**Steps**
1. Open backend/package.json and note its "version" value.
2. Run `curl -s http://localhost:3001/api/version`.

**Expected result**
- The response "version" equals the value from step 1.

**Pass/Fail criteria**: PASS if equal; a different value is a FAIL.
**Cleanup**: none.

### TC-API-04 — Version follows a changed package.json (boundary)
| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-02, REQ-NF-04 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend stopped; a scratch local checkout so the change can be discarded |
| **Test data** | Temporary version string `9.9.9` |

**Steps**
1. In the scratch checkout, change "version" in backend/package.json to `9.9.9`.
2. Start the backend and run `curl -s http://localhost:3001/api/version`.
3. Without restarting, change the version again to `8.8.8` and repeat the request.

**Expected result**
- Step 2 returns version `9.9.9`.
- Step 3 still returns `9.9.9` (value is read once at startup, not per request).

**Pass/Fail criteria**: PASS if both hold; FAIL otherwise.
**Cleanup**: discard the change (`git checkout -- backend/package.json`) and restart the backend.

### TC-API-05 — Backend refuses to start without a readable package.json (negative)
| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-04 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend stopped; scratch local checkout |
| **Test data** | none |

**Steps**
1. In the scratch checkout, rename backend/package.json to backend/package.json.bak.
2. Try to start the backend per the project's docs.

**Expected result**
- Startup fails with an error; the process does not begin serving requests.
- `curl http://localhost:3001/api/version` gets no successful response.

**Pass/Fail criteria**: PASS if startup fails and no version is served; FAIL if a version is served. (Note: with package.json missing, the project's own start command may also fail for unrelated reasons; if so record TO CONFIRM how to start the server directly with node.)
**Cleanup**: restore the file name and discard the scratch checkout.

### TC-API-06 — No credentials needed
| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-03 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Backend running |
| **Test data** | none |

**Steps**
1. Run `curl -i http://localhost:3001/api/version` with no Authorization header or cookie.
2. Run it again with a garbage header: `curl -i -H "Authorization: Token not-a-real-token" http://localhost:3001/api/version`.

**Expected result**
- Step 1 returns 200 with the version body.
- Step 2 also returns 200 with the same body (the route ignores authentication).

**Pass/Fail criteria**: PASS if both return 200; a 401, 403 or 5xx is a FAIL.
**Cleanup**: none.

### TC-API-07 — Unknown paths still return the catch-all 404
| Field | Value |
|-------|-------|
| **Traces to** | AC-3 / REQ-F-03 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running |
| **Test data** | none |

**Steps**
1. Run `curl -i http://localhost:3001/api/version` and note it is not 404.
2. Run `curl -i http://localhost:3001/api/unknown-path`.

**Expected result**
- Step 1 is 200 (not 404).
- Step 2 is 404 with body `{"errors":{"body":["Not found"]}}`.

**Pass/Fail criteria**: PASS if both hold; FAIL otherwise.
**Cleanup**: none.

### TC-API-08 — Unit test suite passes including the version test
| Field | Value |
|-------|-------|
| **Traces to** | AC-4 / REQ-F-05 |
| **Type** | API |
| **Priority** | P1 |
| **Preconditions** | Dependencies installed per the project docs |
| **Test data** | none |

**Steps**
1. From the repository root run `npm test -- --run`.
2. Find the version test file under backend/ in the output.

**Expected result**
- A version test file is listed and all its tests pass; the overall run reports no failures from it.
- The test descriptions cover status 200, JSON content type, exact body, package.json match and no credentials.

**Pass/Fail criteria**: PASS if the version tests exist and pass; FAIL if absent or failing.
**Cleanup**: none.

### TC-API-09 — Existing routes unchanged (regression)
| Field | Value |
|-------|-------|
| **Traces to** | AC-5 / REQ-NF-02 |
| **Type** | API |
| **Priority** | P2 |
| **Preconditions** | Backend running with its database |
| **Test data** | none |

**Steps**
1. Run `curl -i http://localhost:3001/api/tags`.
2. Run `curl -i http://localhost:3001/api/articles`.

**Expected result**
- `/api/tags` returns 200 with a JSON object containing a `tags` array.
- `/api/articles` responds as it did before this change (compare to the epic branch before the story merged, or TO CONFIRM the baseline).

**Pass/Fail criteria**: PASS if both respond normally; FAIL on any new error.
**Cleanup**: none.
