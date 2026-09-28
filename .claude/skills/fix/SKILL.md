---
description: Fix a bug test-first while touching as few files as possible.
argument-hint: <symptom or issue>
disable-model-invocation: true
---

Fix this bug: $ARGUMENTS

1. **Locate, don't explore.** Run `npm run -s codemap` once, pick the 1–3 likely files, `grep -n` for the symbol, then read only those files, whole and once (all are ≤200 lines).
2. **Reproduce with a failing test** before changing code:
   - Logic in `src/domain` or `src/application` → `tests/unit/<area>.test.ts` (helpers in `tests/unit/helpers.ts`); run `npx vitest run <file>`.
   - UI flow → `tests/e2e/<task>.spec.ts` with the `AppPage` fixture and `data-testid`; run `npx playwright test <file> --project=desktop --reporter=line`.
   - Only if it can't be a test (visual or native iOS): state the check and use /verify-ui.
3. **Fix at the lowest layer** that owns the behavior (domain function over application over ui). Keep it minimal, no drive-by refactors.
4. **Verify:** re-run that test, then `npm run check 2>&1 | tail -30`. Run `npm run e2e -- --reporter=line 2>&1 | tail -30` only if `src/ui` changed.
5. **Report** in ≤8 lines: cause (`file:line`), fix, test added. Update `docs/user/{en,de}` only if user-visible behavior changed.
