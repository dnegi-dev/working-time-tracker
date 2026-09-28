import { describe, expect, it } from 'vitest';
import {
  DIP,
  DROP,
  END,
  options,
  resolve,
  rest,
  turnAt,
  type SliderState,
} from '../../src/ui/components/workday/sliderGesture.ts';

const max = 280;

/** Drags through the offsets like the slider does, tracking the corner turn. */
function swipe(state: SliderState, path: [number, number][], legal = true) {
  let turn = turnAt(state, 0, 0, max, legal);
  for (const [dx, dy] of path) turn = turnAt(state, dx, dy, max, legal, turn);
  const [dx, dy] = path.at(-1)!;
  return resolve(state, dx, dy, max, legal, turn);
}

/** Evenly spaced points on a straight line from the start to (dx, dy). */
const line = (dx: number, dy: number, steps = 10): [number, number][] =>
  Array.from({ length: steps }, (_, i) => [(dx * (i + 1)) / steps, (dy * (i + 1)) / steps]);

describe('workday slider gesture', () => {
  it('rests left when idle, right when running and in the dip at lunch', () => {
    expect(rest('idle', max)).toEqual({ x: 0, y: 0 });
    expect(rest('running', max)).toEqual({ x: max, y: 0 });
    expect(rest('lunch', max)).toEqual({ x: max, y: DROP });
  });

  it('idle: straight to the right end starts home office, down at the corner starts office', () => {
    expect(resolve('idle', 100, 0, max).target).toBeUndefined();
    expect(
      swipe('idle', [
        [200, 0],
        [400, 5],
      ]),
    ).toMatchObject({ x: max, y: 0, target: 'home' });
    const corner: [number, number][] = [
      [140, 0],
      [280, 0],
      [300, 2],
      [300, 20],
      [300, 40],
    ];
    expect(swipe('idle', corner)).toMatchObject({ y: 40, pocket: 'office', target: 'office' });
    expect(
      swipe('idle', [
        [400, 0],
        [400, 200],
      ]).y,
    ).toBe(DROP);
  });

  it('idle: a diagonal into the corner is home office, not office', () => {
    expect(swipe('idle', line(300, 60))).toMatchObject({ y: 0, target: 'home' });
    expect(swipe('idle', line(600, 120, 20))).toMatchObject({ y: 0, target: 'home' });
  });

  it('idle: overshooting along the track before going down still dips', () => {
    const path: [number, number][] = [
      [280, 0],
      [340, 3],
      [400, 6],
      [400, 40],
    ];
    expect(swipe('idle', path)).toMatchObject({ pocket: 'office', target: 'office' });
  });

  it('idle: no dip away from the right end', () => {
    expect(turnAt('idle', max - END - 10, 60, max)).toBeUndefined();
    const r = resolve('idle', max - END - 10, 60, max, true, { dx: 0, dy: 0 });
    expect(r).toEqual({ x: max - END - 10, y: 0, pocket: undefined, target: undefined });
    expect(resolve('idle', 0, -50, max).y).toBe(0);
  });

  it('running: left end stops, down at that corner stops with the legal break', () => {
    expect(swipe('running', [[-max, 0]])).toMatchObject({ x: 0, target: 'stop' });
    const corner: [number, number][] = [
      [-280, 0],
      [-300, 2],
      [-300, DIP + 2],
    ];
    expect(swipe('running', corner)).toMatchObject({ pocket: 'legal', target: 'stopLegal' });
    expect(swipe('running', line(-300, 60))).toMatchObject({ y: 0, target: 'stop' });
    expect(resolve('running', -100, 0, max).target).toBeUndefined();
  });

  it('running: without a legal break to add the left dip is a plain stop', () => {
    expect(
      swipe(
        'running',
        [
          [-400, 0],
          [-400, 60],
        ],
        false,
      ),
    ).toMatchObject({
      y: 0,
      pocket: undefined,
      target: 'stop',
    });
  });

  it('running: straight down from the right starts lunch, a diagonal does not', () => {
    expect(swipe('running', [[0, 10]])).toMatchObject({ pocket: 'lunch', target: undefined });
    expect(
      swipe('running', [
        [-2, 4],
        [-5, 50],
      ]),
    ).toMatchObject({ x: max - 5, target: 'lunch' });
    expect(swipe('running', line(-16, 32, 4))).toMatchObject({
      pocket: 'lunch',
      target: undefined,
    });
    expect(swipe('running', line(-40, 50))).toMatchObject({ y: 0, target: undefined });
  });

  it('lunch: up into the track resumes', () => {
    expect(resolve('lunch', 30, 0, max)).toMatchObject({ x: max, y: DROP, target: undefined });
    expect(resolve('lunch', 0, -20, max).target).toBeUndefined();
    expect(resolve('lunch', 0, -50, max)).toMatchObject({ y: DROP - 50, target: 'resume' });
    expect(resolve('lunch', 0, -200, max).y).toBe(0);
  });

  it('offers the far end and the pockets of each phase', () => {
    expect(options('idle', true)).toEqual({ end: 'home', pockets: ['office'] });
    expect(options('running', true)).toEqual({ end: 'stop', pockets: ['lunch', 'legal'] });
    expect(options('running', false)).toEqual({ end: 'stop', pockets: ['lunch'] });
    expect(options('lunch', true)).toEqual({ end: 'resume', pockets: ['lunch'] });
  });
});
