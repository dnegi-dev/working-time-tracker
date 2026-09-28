export interface Point {
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Bubble radii for a field of w×h: the focus bubble and the ones around it. */
export function radii(w: number, h: number) {
  const side = Math.min(w, h);
  return { center: clamp(side * 0.22, 60, 100), orbit: clamp(side * 0.1, 30, 40) };
}

/**
 * Fixed spots on an ellipse around the centre. The break always sits at 6 o'clock,
 * the `count` other bubbles share the rest evenly, starting next to it clockwise.
 */
export function orbitSlots(count: number, w: number, h: number): { slots: Point[]; brk: Point } {
  const { orbit } = radii(w, h);
  const rx = w / 2 - orbit - 6;
  const ry = h / 2 - orbit - 6;
  const at = (deg: number) => ({
    x: w / 2 + rx * Math.cos((deg * Math.PI) / 180),
    y: h / 2 + ry * Math.sin((deg * Math.PI) / 180),
  });
  const step = 360 / (count + 1);
  return { slots: Array.from({ length: count }, (_, i) => at(90 + (i + 1) * step)), brk: at(90) };
}

/** Key of the spot the point is over (with a little slack), if any. */
export function hitTarget(p: Point, spots: { key: string; at: Point }[], r: number) {
  return spots.find((s) => Math.hypot(p.x - s.at.x, p.y - s.at.y) < r + 10)?.key;
}
