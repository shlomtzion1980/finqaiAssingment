# Anashim

Full-stack home assignment: browse 10 random people from [randomuser.me](https://randomuser.me),
filter them, open a profile, edit the name, and save a subset to a backend.

| Folder               | What                                                   |
| -------------------- | ------------------------------------------------------ |
| [`client/`](client/) | Vue 3 + TypeScript (Vite, Pinia, Vue Router, plain CSS) |
| [`server/`](server/) | Node + TypeScript (Express 5, SQLite, zod)             |

New here? [`OVERVIEW.md`](OVERVIEW.md) explains the app in plain language.
Also read: [`DECISIONS.md`](DECISIONS.md) · [`AI_USAGE.md`](AI_USAGE.md)

## Run it

Requires **Node 20+** (developed on 22.5) and npm. No database server needed — SQLite is embedded
and the file is created on first start.

```bash
# terminal 1 — API on http://localhost:3001
cd server && npm install && npm run dev

# terminal 2 — UI on http://localhost:5173 (proxies /api to the server)
cd client && npm install && npm run dev
```

Open http://localhost:5173.

No environment variables are required; the defaults work locally. The optional ones (ports, DB file
path, CORS origin, API URL) are listed in [`server/README.md`](server/README.md#environment-variables)
and [`client/README.md`](client/README.md#environment-variables), with a `.env.example` in each folder.

## Deploy with Docker

The server only needs Docker with the Compose plugin. Node and a database aren't required on the host.

```bash
git clone https://github.com/shlomtzion1980/finqaiAssingment.git
cd finqaiAssingment
docker compose up -d --build
```

The app is then at `http://<your-server>:8090`. Use `PORT=9000 docker compose up -d --build` for
another port, or `PORT=127.0.0.1:8090` to listen only locally behind a reverse proxy.

- **client**: nginx serves the built Vue app and forwards `/api` to the server container, so the
  browser talks to a single origin.
- **server**: the Node API. SQLite lives on the `profiles-data` volume, so saved profiles survive
  restarts and redeploys.

Update: `git pull && docker compose up -d --build`. Logs: `docker compose logs -f`.
Stop: `docker compose down` (add `-v` only if you want to erase the saved data).

For HTTPS, put a reverse proxy such as Caddy or Traefik in front, or a load balancer that
terminates TLS.

## Tests

```bash
cd server && npm test   # API integration tests (supertest, in-memory SQLite)
cd client && npm test   # filter + date logic
```

Type checks: `npm run typecheck` in either folder.

## Screens

| Route          | Screen                                                       |
| -------------- | ------------------------------------------------------------ |
| `/`            | Home — Fetch / History                                       |
| `/fetch`       | Random list (randomuser.me), filter by name and country      |
| `/history`     | Saved list (backend), same component and filters             |
| `/fetch/:id`   | Profile detail (RTL) opened from the random list             |
| `/history/:id` | Profile detail (RTL) opened from the saved list              |

Every screen has its own URL, so Back/Forward, reload, and opening a profile in a new tab all work.

## API

| Method   | Path                | Body                         | Responses                |
| -------- | ------------------- | ---------------------------- | ------------------------ |
| `GET`    | `/api/profiles`     | —                            | 200 list (newest first)  |
| `GET`    | `/api/profiles/:id` | —                            | 200, 404                 |
| `POST`   | `/api/profiles`     | `Profile`                    | 201, 400, 409 (exists)   |
| `PATCH`  | `/api/profiles/:id` | `{ name: { title, first, last } }` | 200, 400, 404      |
| `DELETE` | `/api/profiles/:id` | —                            | 204, 404                 |
| `GET`    | `/api/health`       | —                            | 200                      |

Errors are always `{ "error": { "code", "message", "details?" } }`.
