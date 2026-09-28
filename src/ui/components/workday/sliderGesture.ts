export type SliderState = 'idle' | 'running' | 'lunch';
export type Target = 'home' | 'office' | 'stop' | 'stopLegal' | 'lunch' | 'resume';
export type PocketKind = 'office' | 'lunch' | 'legal';

/** How far down (px) the knob must go to count as a dip. */
export const DIP = 28;
/** Dips only work this close (px) to an end of the track. */
export const END = 16;
/** How far the knob sinks into a pocket; the lunch knob rests there. */
export const DROP = 64;
/** Straight targets need the knob this close (px) to the end. */
const SNAP = 4;

const DIP_TARGET: Record<PocketKind, Target> = {
  office: 'office',
  lunch: 'lunch',
  legal: 'stopLegal',
};

export interface Resolved {
  x: number;
  y: number;
  pocket?: PocketKind;
  target?: Target;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where the knob rests: left when idle, right when running, in the right dip at lunch. */
export function rest(state: SliderState, max: number) {
  return { x: state === 'idle' ? 0 : max, y: state === 'lunch' ? DROP : 0 };
}

/**
 * Knob position and target for a drag of (dx, dy) from the resting place.
 * `legal`: whether the left dip adds the legal break while running.
 */
export function resolve(
  state: SliderState,
  dx: number,
  dy: number,
  max: number,
  legal = true,
): Resolved {
  if (state === 'lunch') {
    const y = clamp(DROP + dy, 0, DROP);
    return { x: max, y, pocket: 'lunch', target: y < DIP ? 'resume' : undefined };
  }
  const x = clamp(rest(state, max).x + dx, 0, max);
  const pocket = pocketAt(state, x, max, legal);
  const y = pocket ? clamp(dy, 0, DROP) : 0;
  if (pocket && y >= DIP) return { x, y, pocket, target: DIP_TARGET[pocket] };
  const done = state === 'idle' ? x >= max - SNAP : x <= SNAP;
  const target = done ? (state === 'idle' ? 'home' : 'stop') : undefined;
  return { x, y, pocket, target };
}

function pocketAt(state: SliderState, x: number, max: number, legal: boolean) {
  if (x >= max - END) return state === 'idle' ? 'office' : 'lunch';
  if (x <= END && state === 'running' && legal) return 'legal';
  return undefined;
}
