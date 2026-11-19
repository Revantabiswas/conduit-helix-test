### Eval Scorecard — Story 1.1 · **PASS**

| Gate | Result | Threshold | Status |
|---|---|---|---|
| D1 Lint | 0 new findings (13 pre-existing) | ≤ 0 delta | PASS |
| D2 Type check | N/A — plain JavaScript, no type checker applies | 0 | N/A |
| D3 Static security | 0C / 0H / 0M new | 0C / 0H / ≤5M | PASS |
| D4 Dependencies | 0C / 0H new (lockfile unchanged) | 0C / 0H | PASS |
| D5 Licences | 0 violations | none disallowed | PASS |
| D6 Complexity | max 1 | ≤ 12 | PASS |
| D7 Secrets | 0 new findings | 0 | PASS |
| Unit coverage | 100.0% of changed lines | ≥ 90.0% | PASS |
| Behavioural B1 (this story) | 8/8 scenarios · 5/5 ACs · native (podman not installed) | 100% | PASS |
| Behavioural B2 (cumulative) | N/A — the repository holds no other feature file | 100% | N/A |
| Behavioural B3 (epic scope) | 8/8 scenarios · last and only story · native (podman not installed) | last unit only | PASS |
| API & contract | 1/1 endpoints | all applicable | PASS |
| Regression | 0 new failures (src 157/157, legacy 12/12) | 0 | PASS |
| J1 Architecture | 1.00 | ≥ 0.85 | PASS |
| J2 Security (OWASP 2025) | 1.00 | ≥ 0.85 | PASS |

**Verdict**: PASS · Static Eval: PASS (6 of 7 checks ran — 1 N/A, see reason) · judge `claude-sonnet-5-5` · rubric v1.0.0 (from `architecture.md` v1.0.0)
**J1 breakdown**: ARCH-01 1.0 · ARCH-02 1.0 · ARCH-03 1.0 · ARCH-04 1.0 · ARCH-05 1.0
**J2 breakdown** (3 of 7 criteria applicable): SEC-03 (A05:2025) 1.0 · SEC-05 (A02:2025) 1.0 · SEC-07 (A10:2025) 1.0
**Security advisories (non-blocking)**: SEC-001 Low (public version disclosure, accepted in the Epic) · SEC-002 Medium (no rate limiting on a new public route, Epic puts it out of scope — human decision recommended). See `reports/code-security-reviews/story-1.1-security-review-v1.md`.
**Self-healing**: all loops 0/3
