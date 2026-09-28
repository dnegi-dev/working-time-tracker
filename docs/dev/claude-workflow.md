# Working with Claude Code

Goal: short sessions, a warm prompt cache, small context. Every reply re-sends the whole conversation, so tokens per reply grow with context size.

## Session rhythm

1. **One task per session.** Pick model, effort and fast mode before the first prompt.
2. **Start with a workflow:** `/fix <bug>`, `/feature <what>`, `/explain <question>`.
3. **Finish:** commit or open the PR, then `/clear`. Pausing mid-task: `/handoff`, then `/clear`; later say "continue".

## Signals

`.claude/hooks/context-guard.mjs` shows these automatically:

| Signal            | Meaning                                                       | Do                                                             |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| _(nothing)_       | Context under 120K                                            | Keep going                                                     |
| 🟡 Context 120K+  | Every reply re-reads it                                       | Finish this task, then `/clear`                                |
| 🔴 Context 170K+  | Auto-compact at 200K is close                                 | `/handoff`, then `/clear` now                                  |
| 📷 10+ images     | Screenshots stay in context; dropping them rebuilds the cache | Use `/verify-ui` for visual checks                             |
| ⏸ Not sent        | Idle over 60 min with 100K+ context: cache expired            | `/clear` (+ "continue"), or send again to pay the rebuild once |
| 📝 Handoff from … | A fresh session found a saved handoff                         | Say "continue", or ignore it                                   |

## /clear, /compact or /handoff

| Situation                                        | Use                       | Why                                                     |
| ------------------------------------------------ | ------------------------- | ------------------------------------------------------- |
| Task done and committed                          | `/clear`                  | A fresh session is ~60K tokens, mostly read from cache  |
| Mid-task, cache warm, old context still relevant | `/compact <what to keep>` | Keeps the thread; costs one pass over the context       |
| Mid-task, stepping away over an hour             | `/handoff`, then `/clear` | The cache expires after 60 min; a handoff is ~1K tokens |
| Back after over an hour with a big context       | `/clear`, then "continue" | `/compact` is most expensive now: a full uncached pass  |
| Went down a wrong path                           | `/rewind` (Esc Esc)       | Reuses the earlier cache entry                          |

## Settings

Set in `.claude/settings.json` (shared with the repo):

- `autoCompactWindow: 200000`: safety net for this repo (your user setting of 400000 still applies to other projects).
- Read deny rules for generated output (lockfile, `dist`, coverage, iOS builds, `openapi.json`, holiday data).
- Allow rules for npm scripts, vitest, playwright and read-only git: fewer prompts and waits.
- The signal hooks above.

Your choices in the app:

- **Model:** Opus 5.5 for the main session. `ui-verifier` runs on Sonnet by itself. Switching model mid-session re-processes the whole context.
- **Effort:** medium for routine work, high for hard bugs. On Opus 5.5, changing effort keeps the cache.
- **Fast mode:** decide at session start. Turning it on mid-session re-processes the context once.
- **Connectors and plugins:** turn off what this repo never uses (e.g. Kubernetes, Gmail, Calendar, Apple Notes, unconnected productivity servers). Change them between sessions, not mid-session.
- **CLAUDE.md edits** take effect only after `/clear`.

## Baseline (Sep 2026)

- Fresh session: ~60K tokens of context, ~37K of it from cache.
- The earlier session that built several features in one conversation: 1,007 API calls, 147M cache-read tokens, context up to ~400K, 9 manual compactions, 90 images, and 3 cache rebuilds of 137K–363K tokens after breaks of 77–537 minutes.
