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
grant asked for is `drive.file`: the app reaches only the files and folders it created. Every deal gets its
own folder as soon as it is saved: under "Les jardins de Campagne / Prospects" until it is signed, moved to
"Les jardins de Campagne / Clients" afterwards, renamed when the deal's title or dates change. Documents are
created in that folder. Everything is private to the connected account; sharing a folder in Drive is what
gives other people access. Deleting a deal or a document here never deletes anything in Drive. The grant is stored on the server only: it is never
sent to a page and is left out of the backups.

Needs, in the Google Cloud project of the sign-in client: the Google Drive API enabled, and the consent
screen published (in "Testing" mode Google ends the grant after seven days). The redirect address is the
sign-in one, `/auth/callback`.

## Gmail (conversations read and answered from a deal)

An administrator connects the estate's mailbox in Réglages, card "Gmail" (`/auth/gmail`, same Google
client and same `/auth/callback` as the sign-in). The consent asks for two things: reading the mailbox
(`gmail.readonly`) and sending from it (`gmail.send`). "Gmail API" must be enabled in the Google Cloud
project.

- The grant is stored in the settings under `gmail`. It never leaves the server: not in `/api/state`,
  not through `/api/settings`, not in the backups.
- `GET /api/mail?dealId=` takes the addresses from the deal itself (its contact), searches the mailbox
  for them, and returns only the threads in which one of them really takes part. A page names a deal,
  never an address.
- `POST /api/mail/send` writes to the deal's own address only. A reply joins a thread only after the
  server has checked that this thread is one of the deal's. What is sent is cleaned to formatting tags
  and web or mail links, and built as a plain text + HTML message.
- Conversations are not copied into the database: they are read from Gmail when a deal is opened and
  kept in the page's memory for two minutes. Each message sent is noted in the deal's history.
- `GET /api/mail/attachment?dealId=&messageId=&n=` serves the n-th file of a message, after checking
  that the message belongs to one of the deal's conversations. PDF and common images open in the
  browser; anything else is downloaded, never displayed. Images placed inside a message's text
  (signatures) are not listed as attachments.
- The composer shows the sender, the recipients and the subject as lines. A recipient typed there is
  added to the deal (`mailAddrs`, six addresses at most), so its messages are found too. The server
  refuses any recipient that is not an address of the deal.
- Files joined to a message are files stored for that deal (uploaded from the composer or already among
  its documents); the server refuses a file of another deal. A message with files goes through Gmail's
  upload address.
- Templates and the signature are a shared setting (`mailkit`). A draft saved as a template keeps the
  fields inserted from the deal as `{{Prénom}}`-style names, filled again for each deal.
- Formatting kept in a message: a `<font>` may carry a font, a size or a colour, each checked against a
  strict shape, on the page and again on the server. No other attribute, no style, no image.

### Later sending, followed messages, PDF copies, drafting

- **One delivery path.** `POST /api/mail/send` reads the request into a job, checks it (recipients are
  addresses of the deal, files and images are stored for that deal, Google documents are the deal's
  own), then either sends it or, with `at`, keeps it in `mail_outbox`. A clock sends what is due every
  half minute, running the very same checks again at that moment. A line is marked "sending" before
  anything leaves, so a message cannot leave twice.
- **Images in the text** are files of the app while the message is written (`/api/files/<id>`); to
  leave, each becomes a part of the message itself (`cid:`). No other image survives.
- **PDF copies.** A Google Docs file of the deal is exported as PDF. A page made in the app (a quote) is
  turned into a temporary Google Docs file, exported, and removed. Both need the Drive connected.
- **Opens and clicks**, off unless the person turns them on: one image (`/t/<token>.gif`) and links
  rewritten to `/t/<token>/<n>`. The token names nothing; the real addresses stay in `mail_tracks`, so
  a link cannot be bent to redirect elsewhere. The CNIL treats this as a tracker (recommendation
  n° 2026-042 of 12 March 2026): it is the estate's call, and the page says so before turning it on.
- **Drafting with Claude** (`POST /api/mail/draft`), off until `ANTHROPIC_API_KEY` is set in the box's
  `.env`. `AI_MODEL` (default `claude-opus-5-5`) and `AI_DAILY_MAX` (default 30 drafts a day) are
  optional. What is sent to the model: the deal's main facts, the open conversation, the person's hint.
  The client's messages are passed as content inside a marked block, never as instructions.

## Visits and Google Agenda

A visit is planned from a deal (composer tab "Visite"): day, hour, length, a few words. It is kept in
the deal (`visits`), listed above its documents, shown on its day in the calendar, and can be corrected
or deleted (with a confirmation).

An administrator may connect the estate's Google Agenda in Réglages (`/auth/agenda`, scope
`calendar.events`, "Google Calendar API" enabled in the Google Cloud project). Each coming visit is then
written as one event in the account's main calendar, updated when the visit or its deal changes, and
removed with it.

- The page names a deal and a visit; the server reads the visit from the saved deal and derives the
  event's identifier from both. No other event of the calendar can be reached from a page.
- Times are sent as local times with the zone `Europe/Paris`.
- Disconnecting one Google connection (Drive, Gmail, Agenda) only hands the grant back to Google when
  no other connection uses the same account: Google ends all of an account's grants at once.
- Visits are not part of the iCal export, which exists to block booked dates on rental platforms.

## The rental agreement

`web/contract.js` holds the estate's agreement in French and in English. A deal carries the language of
its documents; the lessor's details come from the settings (card "Bailleur"), never from the code. A draft
is filled from the deal every time it is shown. A draft created in Google Drive is written again when the
deal changes, unless someone has typed in it in Google Docs since: the server compares the document's
modification time with the one recorded after its own last write, and leaves an edited document alone
until the person asks, from the panel, to overwrite it.
