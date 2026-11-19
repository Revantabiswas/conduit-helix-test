# Artifact Completeness Check — story-1.1 — 2026-11-19T13:28:25Z

Expected list built from common/work-unit-artifacts.md Section 1 and the gates recorded in eval.json.

| File | Required because | Present | Format OK | Consistent | Action taken |
|---|---|---|---|---|---|
| reports/unit-test-evidence/story-1.1/baseline-regression.log | E1 always | yes | yes | yes | re-captured at base in a clean worktree after the sqlite3 repair |
| reports/unit-test-evidence/story-1.1/unit-test-run.log | E1 always | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/coverage/ (lcov.info, coverage-summary.json, html, changed-lines-coverage.json) | E1 always | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/full-regression.log | E1 always | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/test-placement-check.log | test files changed | yes | yes | yes | none |
| reports/unit-test-evidence/story-1.1/evidence-manifest.md | E1 always | yes | yes | yes | none |
| reports/behavior-test-evidence/story-1.1/b1/ (log, report json, manifest) | E2 always | yes | yes | yes | none |
| reports/behavior-test-evidence/story-1.1/b3/ (log, report json, manifest) | B3 ran (last and only unit) | yes | yes | yes | none |
| reports/api-contract-test-evidence/story-1.1/ (log, report json, manifest) | plan has an API step | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/eval.json, eval-summary.md | E6 always | yes | yes | yes | none |
| reports/eval-evidence/story-1.1/static/ + static/baseline/ | D1, D3, D4, D5, D6, D7 ran | yes (7 baseline outputs for 6 D-gates) | yes | yes | removed stray .err files from baseline |
| reports/eval-evidence/story-1.1/judge/architecture-score.json, security-score.json | J1 and J2 scored | yes | yes | yes | none |
| reports/reviews/story-1.1-code-review-v1.md | E7 always | yes | yes | yes | none |
| reports/code-security-reviews/story-1.1-security-review-v1.md | E8 always | yes | yes | yes | none |
| runtime-artifacts/stories/story-1.1/audit.md, state.md | E10 always | yes | yes | yes | none |
| tests/.evals/ci-manifest.d/story-1.1.json | E9, only when CI/CD Enabled: Yes | n/a | n/a | n/a | CI/CD Enabled: No, not written |

**N/A gates and reasons**: D2_types — plain JavaScript, no type checker applies. behaviorB2 — no other feature file in the repository. No folder exists for either (b2/ is absent).
**Consistency**: every manifest Status equals eval.json; eval-summary.md has one row per gate; figures match (8/8 unit tests, 100.0% changed lines, 8/8 scenarios, 5/5 AC tags, 1 endpoint, 0 new failures); the code review names security review v1 and its J1/J2 values equal judge/*.json.
**Result**: clean.
