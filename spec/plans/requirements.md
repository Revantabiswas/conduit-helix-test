# Requirements: Backend version endpoint (KAN-25)

## Intent Analysis
- **User request**: Add a GET /api/version endpoint to the backend returning JSON {"name":"conduit","version":<version from backend/package.json>}, with a unit test. Single small story, minimal change.
- **Request type**: New Feature
- **Scope estimate**: Single Component (backend/)
- **Complexity estimate**: Trivial
- **Depth**: Minimal (refined Epic spec/plans/epic-brief.md already defines measurable criteria)
- **Context Project artifacts consulted**: none (Existing Knowledge: No). **New References consulted**: none.
- **Existing-system context**: spec/plans/knowledge-hub-deep-dive.md (derived locally; Knowledge Hub was not consulted), findings F1 to F5.

## Functional Requirements
- **REQ-F-01**: The Express backend (backend/) MUST expose GET /api/version returning HTTP 200 with a JSON body exactly {"name":"conduit","version":"<value>"} (Epic SC-1).
- **REQ-F-02**: The version value MUST equal the "version" field of backend/package.json (currently 1.0.0), read once at startup with no hardcoded duplicate (SC-2).
- **REQ-F-03**: The route MUST be public: no authentication or credentials required (SC-3). It MUST be mounted before the catch-all 404 handler in backend/index.js (F4).
- **REQ-F-04**: If backend/package.json cannot be read, the backend MUST fail at startup rather than serve a wrong version (SC-5). No runtime error handling is added.
- **REQ-F-05**: A unit test MUST cover REQ-F-01 to REQ-F-03 (status 200, JSON content type, exact body, version equals package.json, no credentials) and run under the existing vitest setup (backend/**/*.test.js, root vitest.config.js).

## Non-Functional Requirements
- **REQ-NF-01** (constraint): No new dependency is added to any package.json (SC-4).
- **REQ-NF-02** (maintainability): Follow existing backend conventions: CommonJS, an express.Router module under backend/routes/, mounted under /api in backend/index.js. Minimal change; the existing routes and tests are untouched.
- **REQ-NF-03** (security): The response exposes only name and version (no build metadata, commit hash or user input handling). Public exposure of the version string is an accepted risk (Epic risk register).
- **REQ-NF-04** (performance): No per-request I/O; the value is held in memory after startup.

## Out of Scope
Frontend display of the version; commit hash or build metadata; authentication or rate limiting; graceful runtime handling of an unreadable package.json; changes to the Next.js app under src/.

## Design Notes (from reverse engineering)
- backend/index.js exports nothing and listens at load (F2), so the route lives in its own router module (for example backend/routes/version.js) so the unit test can exercise it without starting the server.

## Extension Compliance
- **Security Baseline**: enforced. Applicable rules reviewed for this change: SECURITY-08 deny-by-default is deliberately overridden for this one route (explicit public decision in the Epic, REQ-F-03); SECURITY-05 input validation is N/A (no parameters); SECURITY-15 is satisfied by failing at startup instead of serving a wrong value; SECURITY-10 is satisfied by REQ-NF-01. SECURITY-01, -02, -06, -07, -12, -13, -16 are N/A (no data store, network, credential or crypto change). Remaining rules are re-checked at design and code review.
- **Resiliency Baseline**: not enabled (user answer B).
- **Property-Based Testing**: not enabled (user answer C).
- **Playwright Test Automation**: off for server runs.
