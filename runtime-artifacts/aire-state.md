# aire State Tracking

## Project Information
- **Project Type**: Brownfield
- **Start Date**: 2026-09-09T06:16:42Z
- **Current Stage**: PLANNING - Workspace Detection

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: JavaScript (ES Modules)
- **Build System**: npm workspaces (backend/, frontend/)
- **Project Structure**: Decoupled full-stack monorepo (React SPA + Express MVC API)
- **Workspace Root**: /Users/revanta.biswas/Desktop/conduit-helix-test
- **Reverse Engineering Needed**: No — Atlas deep dive doc pulled directly

## Code Location Rules
- **Application Code**: `src/` for all NEW code (the migration target `conduit-next/` per the epic brief will be created under `src/conduit-next/` unless design stages decide otherwise)
- **Documentation**: spec/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Code Root
- **Type**: monorepo (existing) — new code goes to `src/`
- **Path(s)**: backend/ (existing, untouched during migration until cutover), frontend/ (existing, untouched during migration until cutover), src/ (NEW Next.js app target)
- **Recorded**: 2026-09-09T06:16:42Z
- **Note**: Existing `backend/` and `frontend/` workspaces are the CURRENT system being migrated away from — left in place per the phased migration plan until Phase 3 cutover. All NEW Next.js application code goes into `src/` per AIRE's directory-structure rule (the migration plan's own `conduit-next/` naming is treated as `src/`).

## Tracker
- Type: GITHUB
- Parent Epic: none
- Epic URL: —
- Project Key / Repo / Org: revanta-biswas/conduit-helix-test

## Context Project
- **Existing Knowledge**: No
- **Existing Knowledge Path(s)**: —
- **New References**: No
- **New Reference Path(s)**: —

## Existing-System Context
- **Workspace type**: migration
- **Helix MCP**: connected
- **Source**: atlas
- **Components in scope**: whole estate (backend/, frontend/, PostgreSQL via Sequelize) — full migration scope per epic brief
- **Atlas deep dive doc**: spec/plans/atlas-deep-dive.md
- **Recorded**: 2026-09-09T06:16:42Z

## Helix MCP Binding
- **Server**: helix
- **Docs tool(s)**: mcp__helix__get_solution_document_tool, mcp__helix__list_solution_documents_tool — fetches solution documents (System Exploration deep dive, Migration Strategy) by ID
- **Graph/Search tool(s)**: mcp__helix__codebase_agent_query, mcp__helix__codebase_cypher_query, mcp__helix__document_chatbot_query — natural-language / Cypher / RAG queries over the codebase graph and docs
- **Estate / workspace id**: solution_id 960 (conduit-helix-test)
- **Resolved**: 2026-09-09T06:16:42Z

## CI Configuration
- **CI Pipeline Generation**: SKIPPED (user explicit request — "skip ci for this entirely only development")
- **SonarQube Gate**: SKIPPED
- **Epic-level smoke test (smoke-test-epic)**: SKIPPED
- **Note**: All other gates (unit tests, coverage, Gherkin/behavior, D1-D7 static, judge gates run locally via dev-implement) still apply. Only the generated GitHub Actions CI pipeline and its associated setup gates are omitted for this cycle.

## Branching
- Base Branch: main
- Epic Branch: epic/nextjs-migration
- Epic PR: (not raised — raised manually at cycle end via pr-generator)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Property-Based Testing | No | Requirements Analysis |
| Resiliency Baseline | No | Requirements Analysis |
| Security Baseline | Yes (always mandatory) | Workflow start |
| Playwright Test Automation | Yes (always mandatory) | Workflow start |

## Migration Decisions (from Requirements Analysis)
- **Language**: JavaScript (not TypeScript) — matches current codebase
- **Styling**: Port existing CSS as-is — no Tailwind adoption
- **ORM**: Sequelize retained, models ported as-is (no Prisma switch)
- **Cutover scope this cycle**: Phase 0-2 only (Setup, API, Frontend) — working app in `src/`. Phase 3 (decommissioning old `backend/`/`frontend/`, production deploy/DNS) is a manual follow-up outside this AIRE cycle.

## Stage Progress
- [x] Workspace Detection
- [x] Requirements Analysis
- [ ] User Stories
- [ ] Dependency Graph
- [ ] Workflow Planning
- [ ] Application Design
- [ ] System-Level Design stages
- [ ] STOP CHECKPOINT
