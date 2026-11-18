# To do before the next production deploy

Changes pushed to the development site in fast mode (see CLAUDE.md) leave work that must be done
before production. Remove a line once it is paid.

- Deal sidebar "Stay" section (`src/features/stay-summary`): the existing sidebar and workspace
  unit tests render `DealSidebar` without a tRPC provider and now fail, because the new section
  reads through tRPC. Give those tests a provider (or stub the section), and add tests for
  `getStaySummary` (visibility, empty deal, option vs. confirmed booking) and for `StaySection`.
- Editing the "Stay" section (`src/features/stay-summary/saveStay.ts`, `ui/StayEditor.tsx`):
  checked by hand in a browser only. Add real-Postgres tests for `saveStay`: all parts saved in
  one go, dates moved (old booking cancelled, new one created), dates already booked rolls the
  whole edit back, invalid time refused, tenant contact details and identity number preserved
  when only the name changes, a viewer without edit rights refused.
- Deal header: the owner block, the followers button, the block-visibility eye and the pipeline
  breadcrumb were removed from `DealHeader`. Update `DealHeader.test.tsx` and the workspace tests
  that still expect them.
- `InlineFieldShell`: a click anywhere on a field row now opens its editor (it used to be the
  pencil only). Add tests: row click opens the editor, a click on a link or a button inside the
  value does not, a click that ends a text selection does not. Update the tests and the spec
  note that still describe the value as never being a click target.
- Dates written in the reader's language (`ViewerTime`, the sidebar "Created" row): add a test
  that a deal page with history hydrates without a mismatch in a French browser. Other places
  still format with `toLocaleString()` on the server pass (lead sidebar, contact overview, email
  cards, settings pages) and need the same treatment.
- Per-field editing in the "Stay" section (`ui/EditableStayRow.tsx`, `ui/StayFields.tsx`):
  checked by hand in a browser only. Add component tests for each kind of editor (dates, list,
  time, number, text), for the Save button staying off until the draft differs, and for the
  error line when the server refuses a change.
- Deal sidebar "Finance" block (`src/features/stay-summary/financeOverview.ts`,
  `ui/FinanceSection.tsx`): add unit tests for `buildFinanceOverview` (totals leave the caution
  out, overdue vs. due on the boundary day, a paid line with and without a bank reference, the
  schedule compared with the deal's value, a deal with no value) and a component test.
  A line counts as matched with the bank when it is paid and carries a reference: replace that
  with a real link to an imported bank transaction once those exist.
- `scripts/import-dossiers.ts`: only exercised by hand against a local database.
- `src/features/dossier-import/importDossier.ts` is past 250 lines: split the write step out.
- Run the full unit and integration suites, the linter and the type check.
