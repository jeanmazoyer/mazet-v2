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

The browser journeys need Playwright (`npm install --no-save playwright`, then
`npx playwright install chromium`): `test/journeys.mjs` covers sign-in, saving, live updates,
conflicts, uploads and rights; `test/screens.mjs` opens every screen with made-up deals.

## Backups

Once a day the server writes everything it holds (people, deals, settings, the list of files)
to `DATA_DIR/backups/domaine-YYYY-MM-DD.json.gz` and keeps the last 30. An administrator can
download the same thing from the settings page. To put one back into an empty database:

```bash
node server/restore.ts domaine-2027-01-31.json.gz
```

Uploaded files are not inside the backup: they live in `DATA_DIR/files`. Not set up yet: a copy
of both to another machine, which is what protects against losing the server itself.

## On the server

See `docker-compose.yml`.

## Season import and audit

Settings, "Importer un planning" also accepts a season file (`"format": "domaine-import-1"`): one entry per
stay with its payments (each one carrying the bank label it was matched to), its documents as Google Drive
links, the information sheet, the Gmail conversations and the remarks made while reading the sources. The
file holds client data: it is prepared outside this repository and never committed. Importing the same file
again updates the stays by `id` and keeps what was done by hand since (notes, tasks, remarks dealt with).

The Audit page confronts every stay of a season with what each source says: dates (sheet, calendar,
contract), contract signed or not, deposit and balance against the bank statement, security deposit,
insurance, information sheet, e-mails. A remark is blocking, to check, or plain information; a remark
marked as dealt with no longer counts. Credits of the statement that no stay claims are listed below.

## Google Drive (documents created from the app)

An administrator connects a Google account from the settings page. From then on, "Créer" on a contract or
a security deposit makes a real Google Docs file, filled from the deal and edited inside the panel. The
grant asked for is `drive.file`: the app reaches only the files and folders it created. Documents go in
"Les jardins de Campagne / <date and title of the stay>" and are private to the connected account; sharing
that folder in Drive is what gives other people access. The grant is stored on the server only: it is never
sent to a page and is left out of the backups.

Needs, in the Google Cloud project of the sign-in client: the Google Drive API enabled, and the consent
screen published (in "Testing" mode Google ends the grant after seven days). The redirect address is the
sign-in one, `/auth/callback`.
