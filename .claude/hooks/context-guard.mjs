// Tells you when to /clear, /compact or /handoff, based on the session transcript.
// Usage (see .claude/settings.json): node context-guard.mjs stop|prompt|start
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync } from 'node:fs';
import { statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const K = 1000;
const WARN = 120 * K; // 🟡 finish the task, then /clear
const ALERT = 170 * K; // 🔴 /handoff + /clear now (auto-compact is at 200K)
const REPEAT = 30 * K; // repeat 🔴 after this much growth
const COLD_MIN = 60; // prompt-cache lifetime on a Claude subscription
const COLD_CTX = 100 * K; // below this, re-caching costs about as much as a fresh session
const IMAGES = 10;
const TAIL = 16 * 1024 * 1024;

const k = (n) => `${Math.round(n / K)}K`;
const emit = (out) => process.stdout.write(JSON.stringify(out));

function readTail(path) {
  const size = statSync(path).size;
  const len = Math.min(size, TAIL);
  const buf = Buffer.alloc(len);
  const fd = openSync(path, 'r');
  readSync(fd, buf, 0, len, size - len);
  closeSync(fd);
  return buf.toString('utf8').split('\n');
}

/** Context size and time of the last main-conversation API call, plus images since compaction. */
function lastTurn(path) {
  let turn;
  let images = 0;
  for (const line of readTail(path).reverse()) {
    if (!line.includes('"usage"') && !line.includes('"image"') && !line.includes('compact_bound'))
      continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.isSidechain) continue;
    if (e.subtype === 'compact_boundary') break;
    const u = e.type === 'assistant' ? e.message?.usage : undefined;
    const ctx = u
      ? (u.input_tokens ?? 0) +
        (u.cache_creation_input_tokens ?? 0) +
        (u.cache_read_input_tokens ?? 0)
      : 0;
    if (!turn && ctx > 0) turn = { ctx, time: Date.parse(e.timestamp) };
    if (e.type === 'user' && Array.isArray(e.message?.content))
      images += JSON.stringify(e.message.content).split('"type":"image"').length - 1;
  }
  return turn && { ...turn, images };
}

function onStop(t, state) {
  const level = t.ctx >= ALERT ? 2 : t.ctx >= WARN ? 1 : 0;
  const msgs = [];
  const grew = level === 2 && t.ctx - (state.warnedAt ?? 0) >= REPEAT;
  if (level > (state.level ?? 0) || grew) {
    msgs.push(
      level === 2
        ? `🔴 Context ${k(t.ctx)}: every reply re-reads all of it. Run /handoff, then /clear.`
        : `🟡 Context ${k(t.ctx)}: finish this task, then /clear. Stepping away for over an hour? Run /handoff first.`,
    );
    state.warnedAt = t.ctx;
  }
  if (t.images >= IMAGES && !state.images)
    msgs.push(
      `📷 ${t.images} images in context. Use /verify-ui so screenshots stay in a subagent.`,
    );
  state.level = level;
  state.images = t.images >= IMAGES;
  if (msgs.length) emit({ systemMessage: msgs.join('\n') });
}

function onPrompt(t, state, handoff) {
  const idle = (Date.now() - t.time) / 60000;
  if (idle < COLD_MIN || t.ctx < COLD_CTX) return;
  if (state.coldAt && Date.now() - state.coldAt < 15 * 60000) {
    delete state.coldAt;
    return;
  }
  state.coldAt = Date.now();
  const fresh = handoff ? '/clear, then say "continue" (a handoff is saved)' : '/clear';
  emit({
    decision: 'block',
    reason:
      `⏸ Not sent. Idle ${Math.round(idle)} min, so the prompt cache has expired: ` +
      `this prompt would re-process ${k(t.ctx)} tokens uncached (so would /compact).\n` +
      `• Cheapest: ${fresh}.\n• Continue anyway: send it again within 15 min.`,
  });
}

function onStart(handoff) {
  if (!handoff) return;
  const at = statSync(handoff).mtime.toLocaleString('sv-SE').slice(0, 16);
  emit({
    systemMessage: `📝 Handoff from ${at}. Say "continue" to pick it up.`,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext:
        'A handoff note exists at .claude/handoff.md. If the user wants to continue that task, read it first; otherwise ignore it.',
    },
  });
}

try {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
  const event = process.argv[2];
  const dir = input.cwd ?? process.cwd();
  const handoff = existsSync(join(dir, '.claude/handoff.md')) && join(dir, '.claude/handoff.md');
  if (event === 'start') onStart(handoff);
  else if (input.transcript_path && existsSync(input.transcript_path)) {
    const t = lastTurn(input.transcript_path);
    const file = join(tmpdir(), 'claude-context-guard', `${input.session_id}.json`);
    const state = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
    if (t && event === 'stop') onStop(t, state);
    if (t && event === 'prompt') onPrompt(t, state, handoff);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(state));
  }
} catch {
  // Never get in the way of a session.
}
