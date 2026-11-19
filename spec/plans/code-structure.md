# Code Structure

> Existing-system context derived locally; Knowledge Hub was not consulted. (The studio-knowledge MCP tools were not available in this session; user chose local generation. Facts verified against the code at commit 88d4e6a.)

## Build System
- **Type**: npm workspaces (root package.json; workspaces backend and frontend). Root scripts: dev, start, test (vitest), migrate.
## Key Modules (backend/)
- index.js (app bootstrap), routes/ (users, user, articles, profiles, tags; articles/comments and favorites subrouters), controllers/, middleware/ (authentication.js verifyToken, errorHandler.js), models/, helper/ (jwt, bcrypt, customErrors, helpers + helpers.test.js), migrations/, seeders/, config/config.js.
## Other roots
- src/ (Next.js: app/, components/, lib/), frontend/ (Vite), tests/ (api, unit, components, behavior, e2e), docs/, forge-archives/, runtime-artifacts/, spec/.
## Existing Naming Patterns
- CommonJS in backend/, ES modules in src/ and tests/. Routers: const router = express.Router(); module.exports = router.
## Context folders
- spec/context-project/ is human-curated Forge input, not application source.
