> **Source**: Jira Epic KAN-25 (refined via intent-intake and intent-refinement)
> **Fetched**: 2026-11-19T12:56:55Z
> **Note**: verbatim copy of the refined spec/plans/epic.md; do not edit.

---
intent_id: INT-version-endpoint
title: Backend version endpoint
status: epic
fill_level: full
kpi: None tracked (internal hygiene)
confidence: high
context_link: plain English - no external doc
tracker_id: KAN-25
gate: intake-passed
owner: admin
created: 2026-11-19
updated: 2026-11-19
---

# Intent: Backend version endpoint

## 1. Outcome - the why  ·  [BASELINE]

Anyone can confirm which version of the backend is running by making a single request.

## 2. Business outcome & KPI  ·  [BASELINE]

- **KPI:** None tracked; internal hygiene with no business metric.
- **Target (if known):** n/a

## 3. Success signal -> success criteria  ·  [BASELINE -> FULL]

**Baseline signal:** Anyone can confirm the deployed backend version with a single request.

**Testable criteria (full):**
| # | Criterion (measurable) | How it's verified |
|---|------------------------|-------------------|
| SC-1 | GET /api/version returns HTTP 200 with a JSON body exactly equal to {"name":"conduit","version":"<version in backend/package.json>"} (currently 1.0.0) | Automated unit test asserting status, content type JSON and exact body |
| SC-2 | The version value equals the "version" field of backend/package.json, with no hardcoded duplicate | Unit test compares the response to the value read from package.json |
| SC-3 | The route needs no authentication | Unit test calls the route with no credentials and gets 200 |
| SC-4 | No new dependency is added | package.json dependencies unchanged in the diff |
| SC-5 | If package.json cannot be read, the backend fails at startup rather than serving a wrong version | Code review of the startup read (no silent fallback) |

## 4. Scope  ·  [BASELINE requires >=1 out; FULL completes both]

**Explicitly out of scope**
- Frontend display of the version.
- Commit hash or build metadata in the response.
- Authentication or rate limiting on the endpoint.
- Graceful runtime error handling for an unreadable package.json (startup failure is the chosen behaviour).

**In scope**
- A GET /api/version route in the backend under the existing /api routing.
- The version is read from backend/package.json once at startup, using no new dependency.
- A unit test for the endpoint following the existing backend test conventions.
- One small user story; keep the change minimal.

## 5. Constraints  ·  [BASELINE: known-or-"none"; FULL: complete]

- Must not add new dependencies.
- Must stay unauthenticated and public (no auth middleware on this route).
- Must follow the existing backend routing and test conventions (route under /api, existing test framework).
- Version source is backend/package.json, read at startup (not an environment variable).

## 6. Open questions & confidence  ·  [BASELINE]

Confidence: high.

| # | Question | Owner | Resolution |
|---|----------|-------|------------|
| OQ-1 | None open | admin | |

---

## 7. Domain & system context - DDD  ·  [FULL]

- **Bounded contexts:** Backend HTTP API (service metadata). Touches no business domain.
- **Key entities:** Service name ("conduit") and service version (string from backend/package.json). No persisted entities.
- **Core invariants:** The reported version always equals the package.json version; the response shape is exactly two string fields, name and version.

## 8. Users & personas  ·  [FULL]

- **Developer / operator:** needs to confirm which backend build is deployed with one request.
- **Deploy pipelines and monitoring tools:** may read the version automatically (not a driver for this story).

## 9. Compliance & risk  ·  [FULL]

- **Compliance:** None applicable.
- **Risk register:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Public endpoint discloses the version string | Medium | Low | Accepted by decision; only name and version are exposed, no build metadata |
| package.json path resolves wrongly in a different working directory | Low | Medium | Resolve relative to the module file and cover with the unit test; fail at startup |

## 10. NFR floor  ·  [FULL]

- **Security:** Public read-only route; exposes only name and version; no user input is processed.
- **Availability:** No extra dependency or I/O per request (value read once at startup).
- **Latency:** Constant-time response from memory; no explicit threshold.
- **Observability:** Existing request logging applies; no new logging required.

## 11. Traceability

- **Tracker anchor (Epic):** KAN-25

---

## Intake gate

- [x] Outcome is one business sentence, no solution
- [x] KPI named (explicitly none tracked)
- [x] A rough success signal exists
- [x] At least one explicit out-of-scope
- [x] Known constraints listed
- [x] Confidence set and open unknowns declared
- [x] Context link present
