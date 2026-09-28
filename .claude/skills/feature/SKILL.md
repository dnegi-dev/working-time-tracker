---
description: Build a feature along the repo's recipes, with tests and user docs.
argument-hint: <feature>
disable-model-invocation: true
---

Implement: $ARGUMENTS

1. **Scope:** run `npm run -s codemap`. If a recipe in `docs/dev/ARCHITECTURE.md` fits (command, setting, text, schema), follow it. Read only files you will change or call.
2. **Plan only if needed:** for real design choices, ask one short question or propose a plan of ≤10 lines; otherwise start.
3. **Bottom-up:** domain function + unit test → application → ui (`ui.t()` keys in `en.ts` and `de.ts`, `data-testid` on new controls).
4. **Tests:** unit tests for logic; one e2e spec per user workflow in `tests/e2e/<task>.spec.ts`.
5. **Docs:** update the matching guide in `docs/user/en` and `docs/user/de`.
6. **Verify:** single tests while iterating; at the end `npm run check 2>&1 | tail -30` and `npm run e2e -- --reporter=line 2>&1 | tail -30`. Visual checks via /verify-ui, never screenshots in this conversation.
7. **Report** in ≤10 lines.
