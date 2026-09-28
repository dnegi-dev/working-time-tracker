import type { Point } from '../bubbles/layout.ts';
import { stripFor } from './poolLayout.ts';

export const SMALL = 11;
export const LARGE = 34;
/** Sand or cloud bank: this share of the strip's height. */
export const GROUND = 0.45;
/** Zoomed in, the scene's art grows by this factor so it matches the bigger view. */
export const SCENE_ZOOM = 2.5;

/** Resting bubbles in the strip: lined up in the left half, next to the drop zone. */
export function stripSpots(n: number, w: number, h: number, edge: 'top' | 'bottom'): Point[] {
  const strip = stripFor(h);
  const y = edge === 'top' ? strip / 2 : h - strip / 2 + 6;
  const step = Math.min(2 * SMALL + 4, (w / 2 - 60) / Math.max(1, n));
  return Array.from({ length: n }, (_, i) => ({ x: 20 + i * step, y }));
}

/** Zoomed in: rows of bigger bubbles, stacked up from the ground (or down from the clouds). */
export function sceneSpots(n: number, w: number, h: number, edge: 'top' | 'bottom'): Point[] {
  const cell = 2 * LARGE + 14;
  const ground = stripFor(h) * GROUND * SCENE_ZOOM;
  const cols = Math.max(1, Math.floor((w - 16) / cell));
  return Array.from({ length: n }, (_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const x = w / 2 + ((i % cols) - (inRow - 1) / 2) * cell;
    const d = ground + LARGE + 6 + row * cell;
    return { x, y: edge === 'top' ? d : h - d };
  });
}

/** The spot to drag a resting bubble to: the edge across from the resting place. */
export const returnSpot = (w: number, h: number, edge: 'top' | 'bottom'): Point => ({
  x: w / 2,
  y: edge === 'top' ? h - 44 : 44,
});
