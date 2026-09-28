export interface Slot {
  id: string | undefined;
  name: string;
  minutes: number;
}

/** Distance in px between the centres of neighbouring wheel rows. */
export const STEP = 66;

/** Finger distance → wheel offset: 1:1 up to a neighbour, rubber band beyond or into nothing. */
export function pull(raw: number, hasTarget: boolean): number {
  const mag = Math.abs(raw);
  const eased = hasTarget
    ? mag <= STEP
      ? mag
      : STEP + (mag - STEP) * 0.25
    : 22 * (1 - Math.exp(-mag / 70));
  return Math.sign(raw) * eased;
}

/** Drum-picker look for a row at offset `d` from the centre; an armed row stays fully visible. */
export function look(d: number, armed = false): string {
  const t = Math.min(Math.abs(d) / STEP, 2);
  const scale = 1 - 0.14 * Math.min(t, 1);
  const opacity = armed ? 1 : t <= 1 ? 1 - 0.5 * t : 0.5 * (2 - t);
  const tilt = (-d / STEP) * 16;
  return (
    `transform: perspective(400px) translateY(${d}px) rotateX(${tilt}deg) scale(${scale});` +
    `opacity: ${opacity}`
  );
}

/** Fade new row content in, unless it is already on screen at that spot. */
export function appear(_node: Element, { skip }: { skip: boolean }) {
  return {
    duration: skip ? 0 : 240,
    css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * 6}px)`,
  };
}
