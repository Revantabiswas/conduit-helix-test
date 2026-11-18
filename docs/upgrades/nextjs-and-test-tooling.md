# Upgrade: Next.js and test tooling (KAN-19)

Routine dependency upgrade done as a chore, with a green regression run before merge.

## Checklist
- [x] Bump Next.js to the latest patch of the current major
- [x] Bump Vitest, Playwright and Cucumber to current minors
- [x] Run unit, API, behaviour and e2e suites
- [x] Note any deprecated config keys

## Notes
No application code changed. If a suite regresses after the bump, revert the offending package only and file a follow-up.
