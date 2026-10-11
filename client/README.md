# Client

Vue 3 (Composition API, `<script setup>`) + TypeScript, built with Vite.

## Prerequisites

- Node 20+ (developed on 22.5)
- npm
- The [server](../server) running on port 3001 (the dev server proxies `/api` to it)

## Install and run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for filtering and date logic
npm run typecheck
npm run build      # type-check + production bundle in dist/
```

## Environment variables

All optional (see `.env.example`).

| Variable            | Default                 | Meaning                                              |
| ------------------- | ----------------------- | ---------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api`                  | API base URL as seen by the browser (set when deployed separately) |
| `API_PROXY_TARGET`  | `http://localhost:3001` | Where the dev server proxies `/api`                  |

## Structure

```
src/
  api/          http.ts (fetch wrapper + ApiError), randomUser.ts (fetch + map), profiles.ts (backend)
  stores/       randomProfiles.ts (current batch), savedProfiles.ts (mirror of the DB)
  composables/  useListFilter.ts (filter <-> URL), useFocusOnNavigation.ts
  components/   ProfileDirectory.vue — the list shared by Screens 1 and 2
  views/        Home, RandomList, SavedList, ProfileDetail (RTL), NotFound
  utils/        profile.ts (filter, age, name helpers) + tests
  styles/       base.css (tokens, buttons, inputs)
```

## Library choices

- **Pinia** for state: two small stores with clear owners. One holds the randomuser batch, which
  only exists client-side and must survive navigating to the detail screen and back. The other
  mirrors the server, so Screen 1 can show which rows are already saved. A query cache like
  TanStack Query would suit the server data, but it adds a second state model for one list.
- **Vue Router** with a URL per screen and per profile, so Back, reload and deep links work.
- **Plain CSS, no component library.** The UI is two lists and a form. The RTL screen needs
  precise control over direction, and component libraries often hard-code left/right. All
  spacing uses logical properties (`margin-inline-start`, `border-inline-start`, …), so the same
  styles work in both directions.
