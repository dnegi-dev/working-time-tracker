import type { Instant } from '../../domain/index.ts';

/** Break taken via the break bubble; per device, the running entry just continues meanwhile. */
export interface BreakState {
  since?: Instant;
  lastEnd?: Instant;
  /** Project worked on when the break began. */
  from?: string;
  /** Project queued to come after the break. */
  next?: string;
}

const KEY = 'wtt:break';

export function loadBreak(): BreakState {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as BreakState;
  } catch {
    return {};
  }
}

export function saveBreak(s: BreakState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* per-device convenience only */
  }
}
