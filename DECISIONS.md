# Decisions

## 1. Save vs Delete follows the database, not the screen you came from

The spec defines Save as "not yet in the DB" and Delete as "already in the DB", so I implemented that
condition. If you save someone from Screen 1, go back and open them again, you get Delete, and Update
goes to the backend. Otherwise a second Save would create a duplicate, and Update would edit only
memory while the DB kept the old name. Saved rows are tagged on Screen 1.
**Tradeoff:** Screen 3 needs the saved set even when opened from Screen 1 (one cached request). The
server is the final guard: a duplicate POST is an atomic `ON CONFLICT DO NOTHING` → 409, and the client
treats that as "already saved".

## 2. The app owns its Profile shape; randomuser's payload stops at the client's API layer

`api/randomUser.ts` maps randomuser (pinned to API version 1.4) into our `Profile`. The server
validates that shape with zod and never sees randomuser's format. The id is `login.uuid`, because
`id.value` is often null. I store `dob`, not `age`: a stored age goes stale, so it's derived when
displayed, in UTC so a 1 January birth date doesn't show the previous year west of UTC. For the
same reason the "Name field" is three inputs (title, first, last) under one label, not one text box:
splitting "Ertan Van der Stel" back into first and last name would be a guess. Save and Delete
exclude each other, so Screen 3 always shows three of its four buttons.
**Tradeoff:** the type is declared on both sides. In production I'd generate the client types from
the zod schema or OpenAPI.

## 3. Filter: two controls, instant, stored in the URL

A free-text input for name and a dropdown for country, not one combined box. Country is a closed set,
so a dropdown of the countries actually in the list can't be misspelled. A single box would also be
ambiguous: "Jordan" is both a first name and a country. There's no debounce: filtering 10 rows in
memory takes under a millisecond, so a delay would only add lag. Name matching ignores case and
accents and matches every word in any order ("jo sm" finds John Smith, "celik" finds Çelik), but not
the title. Clicking the Name, Gender or Country header sorts the list (A to Z, then Z to A, then the
original order), with ties ordered by name. `?q=&country=&sort=` sits in the URL, so it survives Back
and reload, separately for each list.
**Tradeoff:** that doesn't scale for History. With real data: `GET /profiles?q=` with pagination and
a ~250 ms debounce.

## Stack choices the brief asked me to defend

- **SQLite (better-sqlite3), not a JSON file or Postgres:** a real database with a primary key and
  atomic writes, and zero setup for the reviewer. A JSON file needs hand-written locking and a full
  rewrite on every change. The SQL sits behind a five-method repository interface, so moving to
  Postgres (needed once there are multiple instances) touches one file.
- **Pinia, two stores:** the random batch exists only on the client and must survive going to the
  detail screen and back (it's also kept in sessionStorage so a reload doesn't lose it). The saved
  store mirrors the server so Screen 1 can tag saved rows. TanStack Query would suit the server data,
  but it's a second state model for a single list.
- **Plain CSS, no component library:** two lists and a form don't need one, and the RTL screen needs
  exact control over direction, which libraries often hard-code. A handful of CSS variables
  (colours, radius, shadows) keep it consistent. The font is Rubik because it covers Hebrew and
  Latin, so the RTL screen matches the rest of the app.

## RTL / LTR on Screen 3

Only Screen 3's root is `dir="rtl" lang="he"`, with Hebrew labels. Data direction depends on what the
data is. Email and phone are forced `dir="ltr"`: `(071)-336-2297` has no letters, so `dir="auto"`
would fall back to RTL and reverse its parts. Name inputs use `dir="auto"`, because randomuser also
returns Persian-script names and users may type Hebrew: Latin stays LTR, Hebrew becomes RTL, and each
input aligns to its own content (`text-align: start`). The address uses `<bdi>`, with city and state
isolated together, otherwise the comma jumps ("Kosovo ,Jagodina"). The primary action is on the
right; Back is a right-pointing arrow at the far end. Spacing uses CSS logical properties only.

## Corners cut deliberately

- No auth, rate limiting or request logging (out of scope). Production: add them plus structured logs.
- The schema is created on startup. Production: versioned migrations.
- No optimistic updates: actions wait for the server and show progress.
- Randomuser failures get a manual "Try again", not automatic backoff.
- Hebrew strings are inline in one view. Production: vue-i18n, with `dir` set per locale on `<html>`.

## Extension: keyboard and screen-reader pass with focus restoration

In a single-page app, a route change loses focus, and Back drops keyboard users at the top. Now every
navigation focuses the page heading, and Back from a profile returns focus to the row you opened,
with the filter intact. Rows are real links (Enter and new tab work), result counts are announced via
`aria-live`, invalid fields set `aria-invalid`, there's a skip link, and animation respects reduced
motion. I chose this because list → detail → back is the core flow. Next: arrow-key navigation
between rows and axe-core in CI.
