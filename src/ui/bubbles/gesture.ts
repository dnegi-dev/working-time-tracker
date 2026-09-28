import type { HapticKind } from '../../ports/index.ts';

/** How long a target must be held before it counts. */
export const HOLD_MS = 600;
/** Ticks while holding, so the hold builds up under the finger. */
const STEPS = 3;

/**
 * Drag-and-hold: resting on a target for HOLD_MS confirms it; moving off or
 * letting go cancels. Framework-free so it can be reasoned about on its own.
 */
export function dragHold(opts: {
  enter: (key: string | undefined) => void;
  confirm: (key: string) => void;
  haptic?: (kind: HapticKind) => void;
}) {
  let current: string | undefined;
  let timers: ReturnType<typeof setTimeout>[] = [];

  function set(key: string | undefined) {
    if (key === current) return;
    timers.forEach(clearTimeout);
    timers = [];
    current = key;
    opts.enter(key);
    if (key === undefined) return;
    opts.haptic?.('tick');
    for (let i = 1; i < STEPS; i++)
      timers.push(setTimeout(() => opts.haptic?.('tick'), (HOLD_MS * i) / STEPS));
    timers.push(setTimeout(() => done(key), HOLD_MS));
  }

  function done(key: string) {
    set(undefined);
    opts.confirm(key);
  }

  return { over: set, end: () => set(undefined) };
}
