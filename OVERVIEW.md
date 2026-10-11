# Anashim: a plain-language guide

## What it is

A small address book of strangers. You pull ten random people from a public test service
(randomuser.me), look through them, and keep the ones you want. The people you keep are stored on a
small server, so they're still there tomorrow.

There are two halves:

- **The client** is the website you click around in (folder `client/`).
- **The server** remembers the people you saved, in a database file on disk (folder `server/`).

## Prerequisites

- **Node.js 20 or newer.** It was built and tested on Node 22.5. Check yours with `node -v`.
- **npm**, which comes with Node.
- An internet connection, because the random people come from randomuser.me.

You don't need a database server, Docker or any accounts. The database is a single file that the
server creates by itself the first time it starts.

## Installation

Install each half once:

```bash
cd server
npm install

cd ../client
npm install
```

## Running the app

You need two terminal windows, one for each half. Start the server first.

**Terminal 1, the server:**

```bash
cd server
npm run dev
```

Wait for `API listening on http://localhost:3001`.

**Terminal 2, the website:**

```bash
cd client
npm run dev
```

Wait for `Local: http://localhost:5173/`, then open **http://localhost:5173** in your browser.

To stop either one, press `Ctrl+C` in its terminal.

## Environment variables

**None are required.** The defaults work on your own computer. If you want to change something,
copy `.env.example` to `.env` in that folder and edit it.

Server (`server/.env`):

- `PORT`: which port the server listens on. Default `3001`.
- `DB_FILE`: where the database file is kept. Default `data/profiles.db`.
- `CORS_ORIGIN`: which website addresses may talk to the server. Default `http://localhost:5173`.

Client (`client/.env`):

- `VITE_API_BASE_URL`: where the website finds the server. Default `/api`.
- `API_PROXY_TARGET`: where the development server forwards `/api` calls. Default `http://localhost:3001`.

## Using the app

### Home

Two big buttons. **Fetch** brings ten new random people. **History** shows the people you've saved.

### The lists

Both lists look the same: photo, name, gender, country, phone and email.

- **Search by name:** type in the Name box. The list narrows as you type, with no search button.
  Accents don't matter, so "zoe" finds "Zoé".
- **Filter by country:** pick one from the Country dropdown.
- **Sort:** click the Name, Gender or Country column title. Click once for A to Z, again for Z to
  A, and a third time to go back to the original order.
- **Open a person:** click their row.

In the Fetch list, people you've already saved have a small **Saved** tag.

### The person's card

The card is in Hebrew and reads right to left, as the assignment asked. The person's details are
mostly in English, so they're shown left to right inside the Hebrew page. A phone number like
`(071)-336-2297` would come out scrambled if it were treated as Hebrew text, so it always stays left
to right.

You can edit the name (title, first and last), and the buttons at the bottom do the rest:

- **Save (שמירה):** stores the person on the server. It only appears when they aren't saved yet.
- **Delete (מחיקה):** removes the person from the server after you confirm. It only appears when they're saved.
- **Update (עדכון):** keeps your name change. For a saved person the change goes to the server; for
  someone not saved, it changes only the list you're browsing.
- **Back (חזרה):** returns you to the list, with your search and sorting as you left them.

You'll see either Save or Delete, never both, because a person is either saved or not.

### Small things it handles for you

- You can't save the same person twice. Open them again and you'll get Delete instead of Save.
- Refreshing the page keeps your current ten people and any name changes.
- Every screen has its own web address, so the browser's Back button works and you can open a card
  in a new tab.
- Age is worked out from the date of birth each time, so a saved person doesn't stay 34 forever.
- If the server is down or the internet drops, you get a plain message and a **Try again** button.
- It works with just a keyboard. Coming back from a card puts you on the person you'd opened.

## Running the tests

```bash
cd server
npm test     # checks the server: saving, renaming, deleting, bad input

cd ../client
npm test     # checks search, sorting and age calculation
```

## Project layout

```
README.md        technical summary and the list of server addresses (API)
OVERVIEW.md      this guide
DECISIONS.md     the choices I made and what each one costs
AI_USAGE.md      which AI tools I used and for what
client/          the website (Vue 3)
server/          the server (Node + TypeScript, SQLite)
```

## Further reading

- `DECISIONS.md` explains why it's built this way.
- `client/README.md` and `server/README.md` go deeper into each half.
