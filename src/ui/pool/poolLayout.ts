import type { RestTheme } from '../../domain/index.ts';
import { radii, type Point } from '../bubbles/layout.ts';

/** Height of the resting-place strip at the field's edge: a tenth of the field, 56–88px. */
export const stripFor = (h: number) => Math.round(Math.min(88, Math.max(56, h * 0.1)));
export const MAX_SHOWN = 8;
/** Largest ellipse the bubbles float on; smaller fields push them inwards like walls. */
export const MAX_RX = 340;
export const MAX_RY = 280;

/** Sky rests at the top; seabed and attic at the bottom. */
export const restEdge = (t: RestTheme) => (t === 'sky' ? 'top' : 'bottom');

/** Project bubbles grow with their share of the hours, up to a quarter bigger. */
export const sizeFor = (orbit: number, share: number) =>
  orbit * (0.85 + 0.4 * Math.sqrt(Math.min(1, share)));

/**
 * Stats bubble in the middle, projects on an ellipse around it, the pump
 * opposite the resting place and the drop zone in the middle of the strip.
 */
export function poolLayout(count: number, w: number, h: number, edge: 'top' | 'bottom') {
  const strip = stripFor(h);
  const top = edge === 'top' ? strip : 0;
  const fh = Math.max(0, h - strip);
  const { center, orbit } = radii(w, fh);
  const wall = sizeFor(orbit, 1) + 4;
  const rx = Math.min(MAX_RX, w / 2 - wall);
  const ry = Math.min(MAX_RY, fh / 2 - wall);
  const mid = { x: w / 2, y: top + fh / 2 };
  const at = (deg: number): Point => ({
    x: mid.x + rx * Math.cos((deg * Math.PI) / 180),
    y: mid.y + ry * Math.sin((deg * Math.PI) / 180),
  });
  const pumpDeg = edge === 'top' ? 90 : -90;
  const step = 360 / (count + 1);
  return {
    strip,
    mid,
    rx,
    ry,
    center,
    orbit,
    slots: Array.from({ length: count }, (_, i) => at(pumpDeg + (i + 1) * step)),
    pump: at(pumpDeg),
    zone: { x: w / 2, y: edge === 'top' ? strip / 2 : h - strip / 2 },
  };
}
