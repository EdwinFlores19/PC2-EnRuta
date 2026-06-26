# AGENTS.md — PC2-PFDC3

## Structure

Two independent packages in a monorepo-like layout, each with their own `package.json`, env, and config:

- `backend/` — Express + Prisma ORM + PostgreSQL (Supabase). CommonJS (`require`/`module.exports`). Entry: `server.js`.
- `frontend/` — React + Vite SPA. ESM (`"type": "module"`). Entry: `src/` (Vite-managed).
- `scripts/` — Python Jira automator reading `epics_and_stories.json`.
- `.agents/` — Agent ecosystem (Scrum Master, Architect, Backend DBA, DevOps). See `.agents/AGENTS.md` for their rules.
- `docs/` — Report templates. `informe-pc2.md` is the canonical output document.

## Key commands (run from each package's directory)

| Scope | Command | Notes |
|---|---|---|
| Backend | `npm run dev` | Nodemon hot-reload on `server.js` |
| Backend | `npm test` | Jest (`--passWithNoTests`), Supertest available |
| Backend | `npm run lint` | ESLint JS (no config file found yet) |
| Backend | `npx prisma generate && npx prisma migrate dev` | Required after schema changes |
| Backend | `node prisma/seed.js` | DB seeding |
| Backend | `npx prisma studio` | Prisma GUI (localhost:5555) |
| Frontend | `npm run dev` | Vite dev server on :5173 |
| Frontend | `npm test` | Vitest (jsdom env, see vite.config.js) |
| Frontend | `npm run build` | Production build to `frontend/dist/` |
| Frontend | `npm run lint` | ESLint JS/JSX with react plugins |
| Jira (root) | `python scripts/jira_automator.py` | Reads `scripts/epics_and_stories.json` |
| Jira (root) | `python scripts/jira_automator.py --dry-run` | Preview only |

## Env files

- `backend/.env` — Backend: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`, `BCRYPT_ROUNDS`
- `frontend/.env` — Frontend: `VITE_API_URL`, `VITE_APP_NAME` (all must start with `VITE_`)
- Root `.env` — Jira scripts: `JIRA_DOMAIN`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `JIRA_PROJECT_KEY`
- Each has a `.env.example` as template.

## Architecture constraints

1. **Express is a long-running server** — never serverless, never delegate business logic to Supabase.
2. **Supabase is PostgreSQL infrastructure only** — no Supabase Edge Functions, no RLS for business rules.
3. **Git flow** — `main` → `develop` → `feature/*` or `hotfix/*`.
4. **Backend CORS** configured in `server.js:57-88` — must whitelist any new frontend URL.
5. **Vite proxy** in `vite.config.js:36-43` forwards `/api` to backend in dev (avoids CORS issues locally).
6. **Frontend path aliases** — `@`, `@components`, `@pages`, `@hooks`, `@utils`, `@api`, `@context` (configured in vite.config.js).
7. **API prefix** — `/api/health` for health check, `/api/v1/` for business endpoints.

## CI/CD

`.github/workflows/deploy.yml` runs on push to `main` or `develop`. Jobs:
1. Backend CI (ESLint → Jest tests → coverage)
2. Frontend CI (ESLint → Vitest → build)
3. Security audit (npm audit)
4. Deploy to staging (develop) / production (main) — deploy hooks currently commented out, need Render/Vercel secrets.

## Testing quirks

- **Backend** (Jest): config in `package.json` — `testPathPattern: "tests/"`, tests directory at `backend/tests/`.
- **Frontend** (Vitest): config in `vite.config.js` — `jsdom` env, expects `src/test/setup.js` (not created yet).
- Prisma connection is needed for backend tests (mock or use `DATABASE_URL` env).
- Logger silences in NODE_ENV=test (`logger.js:64`).

## Prisma / DB notes

- Schema: `backend/prisma/schema.prisma` — single source of truth.
- Use `directUrl` env var for Supabase pgBouncer when running migrations (commented in schema).
- UUID primary keys, bcrypt password hashing, standard timestamps.
- Prefer soft delete (`isDeleted`) over physical DELETE.

## Style / conventions

- **JSDoc** on all endpoints, controllers, services.
- **express-validator** for input validation in middlewares.
- **Response format**: `{ status, data, message, pagination }`.
- **HTTP status codes**: 201 (create), 200 (success), 400 (validation), 401 (unauth), 403 (forbidden), 404 (not found), 409 (conflict), 422 (validation), 500 (server error).
- Backend: MVC layers (route → controller → service → repository).
- Frontend: Axios instance at `src/api/axios.js` with JWT interceptors and auto token refresh.
