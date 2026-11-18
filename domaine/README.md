# Le Domaine

The estate's own app: deals, stays, calendar, documents, payments. One small Node server
(Hono), Postgres, and pages with no build step.

## Layout

- `server/`: the HTTP server. `main.ts` (routes), `auth.ts` (Google sign-in, sessions),
  `deals.ts` (what each role may read and write), `ical.ts` (imported calendars), `db.ts`
  (connection and migrations), `migrations/` (numbered SQL files, applied at start).
- `web/`: the pages, served as they are. `app.js` draws every screen; `app.css` is the design.
- `test/`: `rules.test.ts` (sign-in, rights, calendar parsing) and `journeys.mjs` (the app end
  to end, in a browser).

## How data is kept

A deal is saved whole, as the page shows it, with a version number. A save that carries an
older version is refused and the page shows the newer one, so two people never overwrite each
other silently. Every save is announced through Postgres (LISTEN/NOTIFY) and pushed to the
open pages (server-sent events).

## Run it on a laptop

```bash
npm install
```

```bash
BASE_URL=http://localhost:3300 PORT=3300 DATABASE_URL=postgres://user:pass@localhost:5432/postgres DEV_LOGIN=true node --watch server/main.ts
```

`DEV_LOGIN=true` adds `/auth/dev?email=...` (sign-in without Google). It only works when
`BASE_URL` is a localhost address.

```bash
npm test
```

```bash
BASE=http://localhost:3300 node test/journeys.mjs
```

## Settings (environment)

| Name | Meaning |
|---|---|
| `BASE_URL` | Public address of the site |
| `DATABASE_URL` | Postgres |
| `DB_SCHEMA` | Schema holding the tables (default `domaine`) |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | Google sign-in. Redirect address: `BASE_URL/auth/callback` |
| `ALLOWED_EMAILS` | Administrators' Google addresses, comma separated |
| `DATA_DIR` | Folder for uploaded files |

## On the server

See `docker-compose.yml`. Not set up yet: a nightly backup of the database and of the uploaded
files to another place.
