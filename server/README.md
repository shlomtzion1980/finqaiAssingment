# Server

Node + TypeScript API that persists saved profiles in SQLite.

## Prerequisites

- Node 20+ (developed on 22.5)
- npm

`better-sqlite3` ships prebuilt binaries for common platforms, so `npm install` doesn't need a
compiler. It's pinned to v11 because v13 crashes on Node 22.5.

## Install and run

```bash
npm install
npm run dev        # watch mode on http://localhost:3001
npm test           # integration tests against an in-memory database
npm run typecheck
npm run build && npm start   # production build to dist/
```

## Environment variables

All optional. Put them in `server/.env` (see `.env.example`) or in the shell.

| Variable      | Default                 | Meaning                                    |
| ------------- | ----------------------- | ------------------------------------------ |
| `PORT`        | `3001`                  | HTTP port                                  |
| `DB_FILE`     | `data/profiles.db`      | SQLite file, created on first start        |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed browser origin(s), comma-separated |

Invalid values fail at startup with a clear message instead of misbehaving later.

## Structure

```
src/
  index.ts                 composition root: config → db → repository → service → app
  app.ts                   express app factory (injected deps, so tests use :memory:)
  config.ts                env parsing/validation (zod)
  db.ts                    open SQLite + schema
  http/
    errors.ts              HttpError, NotFoundError, ConflictError, ValidationError
    middleware.ts          parseOrThrow, 404 handler, error handler
  profiles/
    profile.schema.ts      zod schemas = the API contract + inferred types
    profile.repository.ts  SQL only; maps rows <-> domain objects
    profile.service.ts     business rules (exists? conflict?) -> domain errors
    profile.routes.ts      HTTP only: parse input, call service, pick status code
test/
  profiles.api.test.ts
```

Each layer only knows the one below it. The repository is an interface, so moving to Postgres
means a new implementation of five methods, without touching routes or the service.

## Why SQLite (better-sqlite3)

- Zero setup for a reviewer: no Docker and no DB server, yet it's a real database with a primary
  key, constraints and atomic writes. A JSON file would need hand-written locking and full
  rewrites on every change.
- `INSERT … ON CONFLICT DO NOTHING RETURNING *` makes "save twice" a single atomic statement
  that maps cleanly to 409, with no check-then-insert race.
- Synchronous API: queries take microseconds and the code stays simple. In production with
  several instances I'd move to Postgres behind the same repository interface.
