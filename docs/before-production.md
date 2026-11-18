# To do before the next production deploy

Changes pushed to the development site in fast mode (see CLAUDE.md) leave work that must be done
before production. Remove a line once it is paid.

- Deal sidebar "Stay" section (`src/features/stay-summary`): the existing sidebar and workspace
  unit tests render `DealSidebar` without a tRPC provider and now fail, because the new section
  reads through tRPC. Give those tests a provider (or stub the section), and add tests for
  `getStaySummary` (visibility, empty deal, option vs. confirmed booking) and for `StaySection`.
- `scripts/import-dossiers.ts`: only exercised by hand against a local database.
- `src/features/dossier-import/importDossier.ts` is past 250 lines: split the write step out.
- Run the full unit and integration suites, the linter and the type check.
