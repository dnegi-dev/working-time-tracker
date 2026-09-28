---
description: Save the current task state to .claude/handoff.md so a fresh session can continue after /clear.
disable-model-invocation: true
---

Write `.claude/handoff.md` (overwrite it; it is gitignored) so a fresh session can continue this task without this conversation. Keep it under 40 lines, facts only, no code or logs:

```
# Handoff: <task> (<YYYY-MM-DD HH:MM>, branch <branch>)
## Goal        what "done" means, 1–2 lines
## Done        what is implemented, committed (hashes) and verified
## State       uncommitted files (git status --short), anything half-done
## Next        numbered, concrete next steps
## Key places  file:line and why, only what the next steps need
## Gotchas     decisions made, dead ends, commands that failed and why
```

Then reply with one line: `Handoff saved. Run /clear, then say "continue".`
