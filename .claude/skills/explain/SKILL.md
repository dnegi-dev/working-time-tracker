---
description: Answer a question about the codebase without editing, using the code map instead of broad exploration.
argument-hint: <question>
disable-model-invocation: true
---

Question: $ARGUMENTS

- Start with `npm run -s codemap`, plus `docs/dev/ARCHITECTURE.md` if the question is about structure or data flow. Then `grep -n` and read only the files that answer the question.
- No subagents: the codebase is about 7K lines, so direct reads are cheaper.
- Don't edit files or run the app.
- Lead with the answer, cite `file:line`, and stay under 20 lines unless asked for more.
