# Working Time Tracker — rules for AI agents

Read `docs/dev/ARCHITECTURE.md` before larger changes. Keep changes small and local.

## Commands

- `npm run check` — lint, typecheck, layer rules, i18n, unit tests + coverage, OpenAPI up to date. **Must pass before commit.**
- `npm run e2e` — Playwright (desktop + mobile). Run for UI/behavior changes.
- `npm run dev` — local app at http://localhost:5173/working-time-tracker/ (login admin/admin).
- `npm run gen:openapi` after changing commands; `npm run gen:holidays` refreshes holiday data.

## Rules

- Layers: `ui → application → domain`; adapters only via `src/main.ts` / `src/wiring`. Never import adapters from ui or application (`npm run arch` fails).
- Domain is pure: no DOM, no libraries, immutable functions returning a new `Dataset`.
- All state changes go through `app.update(domainFn)` or `app.run(command)`.
- No visible text in `.svelte` without `ui.t('key')`; add keys to `src/i18n/en.ts` and `de.ts`.
- Max 200 lines per file — split instead of growing.
- Match existing style: small functions, few comments, `.ts` import extensions.
- Tests: domain/application logic → `tests/unit`; user workflows → `tests/e2e/<task>.spec.ts`, using `data-testid` and the `AppPage` fixture.
- User-facing behavior change → update the matching guide in `docs/user/en` and `docs/user/de` (task-focused: goal → steps → result).
