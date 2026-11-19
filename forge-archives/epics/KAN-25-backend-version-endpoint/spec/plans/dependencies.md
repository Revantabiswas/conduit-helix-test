# Dependencies

> Existing-system context derived locally; Knowledge Hub was not consulted. (The studio-knowledge MCP tools were not available in this session; user chose local generation. Facts verified against the code at commit 88d4e6a.)

## Internal
- Root workspaces: backend, frontend. backend depends on nothing internal; routes depend on controllers, middleware and models.
## External
- backend runtime: bcrypt, cors, dotenv, express, jsonwebtoken, pg, pg-hstore, sequelize. Dev: sequelize-cli.
- KAN-25 constraint: no new dependency may be added.
