EPIC TICKET: https://revanta201.atlassian.net/browse/KAN-25

# User Stories: Backend version endpoint

## Story 1.1: Confirm the deployed backend version with one request
**Tracker ID**: KAN-28 (https://revanta201.atlassian.net/browse/KAN-28)
**Requires**: none
**Persona**: Developer / operator
**Covers**: REQ-F-01, REQ-F-02, REQ-F-03, REQ-F-04, REQ-F-05, REQ-NF-01, REQ-NF-02, REQ-NF-03, REQ-NF-04

As a developer or operator, I want to call GET /api/version on the backend and receive its name and version, so that I can confirm which backend version is running with a single request.

### Acceptance Criteria
- **AC-1** (REQ-F-01, REQ-NF-03): GET /api/version returns HTTP 200 with a JSON body exactly equal to {"name":"conduit","version":"<version>"} and no other fields.
- **AC-2** (REQ-F-02, REQ-F-04, REQ-NF-04): The version equals the "version" field of backend/package.json (currently 1.0.0), read once at startup with no hardcoded copy; if package.json cannot be read, the backend fails at startup instead of serving a wrong version.
- **AC-3** (REQ-F-03): The route needs no authentication (a request with no credentials gets 200) and is mounted before the catch-all 404 handler in backend/index.js.
- **AC-4** (REQ-F-05): A unit test in backend/ covers AC-1 to AC-3 (status, JSON content type, exact body, version matches package.json, no credentials) and runs under the existing vitest setup (npm test).
- **AC-5** (REQ-NF-01, REQ-NF-02): No new dependency is added; the route is its own express.Router module under backend/routes/ mounted under /api, and existing routes and tests are unchanged.

### Notes
- Out of scope: frontend display, commit hash or build metadata, authentication or rate limiting, runtime handling of an unreadable package.json, the Next.js app under src/.
- Small by design: one layer (backend), one scenario class, 5 ACs.

## Requirements Coverage Matrix
| REQ-ID | Covering stories | Status |
|---|---|---|
| REQ-F-01 | 1.1 (AC-1) | Full |
| REQ-F-02 | 1.1 (AC-2) | Full |
| REQ-F-03 | 1.1 (AC-3) | Full |
| REQ-F-04 | 1.1 (AC-2) | Full |
| REQ-F-05 | 1.1 (AC-4) | Full |
| REQ-NF-01 | 1.1 (AC-5) | Full |
| REQ-NF-02 | 1.1 (AC-5) | Full |
| REQ-NF-03 | 1.1 (AC-1) | Full |
| REQ-NF-04 | 1.1 (AC-2) | Full |
