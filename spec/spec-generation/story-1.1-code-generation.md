# Code Generation Plan — Story 1.1 (KAN-28) Confirm the deployed backend version with one request

Context: Code Root monorepo (backend/ is the package this story belongs to). Depends on: none. Design stages skipped; architecture constraints ARCH-01..05 apply. Design reference grounding: none covers this component (no design references registered).

Trace: REQ-F-01..05, REQ-NF-01..04; AC-1..AC-5. Every REQ-ID and AC appears in at least one step below.

## Steps
- [x] 1. Create backend/routes/version.js: express.Router, reads `version` once at module load via `require("../package.json")`, GET "/" responds `res.json({ name: "conduit", version })`; no auth, no models. (REQ-F-01, REQ-F-02, REQ-F-04, REQ-NF-03, REQ-NF-04; AC-1, AC-2)
- [x] 2. Mount it in backend/index.js: one `require("./routes/version")` and `app.use("/api/version", versionRoutes)` before the catch-all `app.get("/*any")`. (REQ-F-03, REQ-NF-02; AC-3, AC-5)
- [x] 3. Unit tests at tests/unit/backend/routes/version.test.js: router in isolation (200, JSON content type, exact body with exactly two fields, equals package.json version, no credentials, garbage Authorization header still 200, non-GET not served) and the real backend/index.js app (status 200 for /api/version and 404 body for an unknown path, proving mount order); startup failure when package.json is unreadable (child process). (REQ-F-01..05; AC-1..AC-4)
- [x] 4. Behaviour step definitions at tests/behavior/steps/story-1.1-version-endpoint_steps.js bound to the public HTTP surface of the backend, for every scenario of spec/behavior/story-1.1.feature. (AC-1..AC-5)
- [x] 5. Unit Test and Coverage step: run the tests, measure changed-lines coverage (>= 90%), capture evidence under reports/unit-test-evidence/story-1.1/. (REQ-F-05; AC-4)
- [x] 6. API and Contract gate: applicable (new endpoint). Tests live in tests/api/version.route.test.js against the real app: status codes, error responses for unknown paths and non-GET, no-auth behaviour, response schema. (REQ-F-01, REQ-F-03; AC-1, AC-3)
- [x] 7. No dependency changes in any package.json (REQ-NF-01; AC-5).

## Files
- new: backend/routes/version.js, tests/unit/backend/routes/version.test.js, tests/api/version.route.test.js, tests/behavior/steps/story-1.1-version-endpoint_steps.js
- modified: backend/index.js (2 lines)
