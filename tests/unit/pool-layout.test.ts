import { describe, expect, it } from 'vitest';
import type { Point } from '../../src/ui/bubbles/layout.ts';
import {
  MAX_RX,
  MAX_RY,
  MAX_SHOWN,
  poolLayout,
  sizeFor,
  stripFor,
} from '../../src/ui/pool/poolLayout.ts';

const widths = [288, 320, 375, 420, 768, 1024, 1600];
const heights = [480, 640, 812, 1000];
const edges = ['top', 'bottom'] as const;

type Circle = Point & { r: number };
const gap = (a: Circle, b: Circle) => Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;

function circles(count: number, w: number, h: number, edge: 'top' | 'bottom') {
  const l = poolLayout(count, w, h, edge);
  return {
    l,
    stats: { ...l.mid, r: l.center },
    pump: { ...l.pump, r: l.orbit },
    // the biggest a bubble gets (all the hours), and the biggest two neighbours get (half each)
    slots: l.slots.map((p) => ({ ...p, r: sizeFor(l.orbit, 1) })),
    pairs: l.slots.map((p) => ({ ...p, r: sizeFor(l.orbit, 0.5) })),
  };
}

describe('pool layout', () => {
  for (const w of widths)
    for (const h of heights)
      for (const edge of edges)
        it(`fits every bubble into ${w}×${h} with the strip at the ${edge}`, () => {
          const strip = stripFor(h);
          const top = edge === 'top' ? strip : 0;
          const bottom = edge === 'top' ? h : h - strip;
          for (let count = 1; count <= MAX_SHOWN; count++) {
            const { stats, pump, slots, pairs } = circles(count, w, h, edge);
            for (const c of [stats, pump, ...slots]) {
              expect(c.x - c.r).toBeGreaterThanOrEqual(0);
              expect(c.x + c.r).toBeLessThanOrEqual(w);
              expect(c.y - c.r).toBeGreaterThanOrEqual(top);
              expect(c.y + c.r).toBeLessThanOrEqual(bottom);
            }
            expect(gap(stats, pump)).toBeGreaterThanOrEqual(0);
            for (const s of slots) {
              expect(gap(stats, s)).toBeGreaterThanOrEqual(0);
              expect(gap(pump, s)).toBeGreaterThanOrEqual(0);
            }
            pairs.forEach((a, i) =>
              pairs.slice(i + 1).forEach((b) => expect(gap(a, b)).toBeGreaterThanOrEqual(0)),
            );
          }
        });

  it('caps the ellipse on big screens, so the bubbles float around the middle', () => {
    const { l } = circles(4, 1600, 1000, 'bottom');
    expect(l.rx).toBe(MAX_RX);
    expect(l.ry).toBe(MAX_RY);
    expect(l.mid).toEqual({ x: 800, y: (1000 - stripFor(1000)) / 2 });
  });

  it('pushes the bubbles inwards as the walls come closer', () => {
    const rx = [1600, 1024, 768, 420, 320].map((w) => poolLayout(4, w, 800, 'bottom').rx);
    const ry = [1000, 812, 640, 480].map((h) => poolLayout(4, 800, h, 'bottom').ry);
    for (const list of [rx, ry])
      list.slice(1).forEach((v, i) => expect(v).toBeLessThanOrEqual(list[i]!));
    expect(rx.at(-1)).toBeLessThan(MAX_RX / 2);
    expect(ry.at(-1)).toBeLessThan(MAX_RY);
  });

  it('grows the resting strip with the field', () => {
    expect(stripFor(400)).toBe(56);
    expect(stripFor(700)).toBe(70);
    expect(stripFor(1200)).toBe(88);
  });
});
