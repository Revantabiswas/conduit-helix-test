# API Documentation

> Existing-system context derived locally; Knowledge Hub was not consulted. (The studio-knowledge MCP tools were not available in this session; user chose local generation. Facts verified against the code at commit 88d4e6a.)

## Express backend (mounted in backend/index.js)
| Method | Path | Auth | Source |
|---|---|---|---|
| GET | / | none (non-production) | index.js |
| POST | /api/users | none | routes/users.js |
| POST | /api/users/login | none | routes/users.js |
| GET, PUT | /api/user | verifyToken | routes/user.js |
| GET, POST | /api/articles | verifyToken | routes/articles.js |
| GET | /api/articles/feed | verifyToken | routes/articles.js |
| GET, PUT, DELETE | /api/articles/:slug | verifyToken | routes/articles.js |
| GET, POST | /api/articles/:slug/comments | verifyToken | routes/articles/comments.js |
| DELETE | /api/articles/:slug/comments/:commentId | verifyToken | routes/articles/comments.js |
| POST, DELETE | /api/articles/:slug/favorite | verifyToken | routes/articles/favorites.js |
| GET | /api/profiles/:username | verifyToken | routes/profiles.js |
| POST, DELETE | /api/profiles/:username/follow | verifyToken | routes/profiles.js |
| GET | /api/tags | none | routes/tags.js |
| any other GET | /*any | none | 404 {errors:{body:["Not found"]}} |

No /api/version route exists. Next.js equivalents live in src/app/api/**/route.js.
