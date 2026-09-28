/** How long a target must be held before it counts. */
export const HOLD_MS = 600;

/**
 * Drag-and-hold: resting on a target for HOLD_MS confirms it; moving off or
 * letting go cancels. Framework-free so it can be reasoned about on its own.
 */
export function dragHold(opts: {
  enter: (key: string | undefined) => void;
  confirm: (key: string) => void;
}) {
  let current: string | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function set(key: string | undefined) {
    if (key === current) return;
    clearTimeout(timer);
    current = key;
    opts.enter(key);
    if (key !== undefined) timer = setTimeout(() => done(key), HOLD_MS);
  }

  function done(key: string) {
    set(undefined);
    opts.confirm(key);
  }

  return { over: set, end: () => set(undefined) };
}
