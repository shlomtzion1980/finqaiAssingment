# AI usage

I used Cursor's agent (Claude) throughout. It scaffolded both projects, wrote first drafts of the
server layers, stores, components and tests, and drove a browser to click through every flow
(fetch, filter, edit, save, rename, delete, reload, API down) and screenshot the RTL screen. That
pass caught real bugs, which I fixed: the comma in "city, state" jumping in RTL, the Back arrow being
reordered by bidi, and an unhelpful "Request failed (500)" when the API is down. It also hit
dependency problems that I resolved by pinning versions: `better-sqlite3` v13 segfaults on Node 22.5,
and `vue-router` 5 needs a newer Vite than this Node supports. The product decisions in DECISIONS.md
(Save/Delete following the DB, URL-based filters, storing `dob` instead of `age`, the BiDi rules) are
mine, and I reviewed every line and can defend it.
