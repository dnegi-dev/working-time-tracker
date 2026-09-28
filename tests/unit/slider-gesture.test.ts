import { describe, expect, it } from 'vitest';
import { DIP, DROP, END, resolve, rest } from '../../src/ui/components/workday/sliderGesture.ts';

const max = 280;

describe('workday slider gesture', () => {
  it('rests left when idle, right when running and in the dip at lunch', () => {
    expect(rest('idle', max)).toEqual({ x: 0, y: 0 });
    expect(rest('running', max)).toEqual({ x: max, y: 0 });
    expect(rest('lunch', max)).toEqual({ x: max, y: DROP });
  });

  it('idle: straight to the right end starts home office, a dip there starts office', () => {
    expect(resolve('idle', 100, 0, max).target).toBeUndefined();
    expect(resolve('idle', 400, 5, max)).toMatchObject({ x: max, y: 5, target: 'home' });
    expect(resolve('idle', 400, 40, max)).toMatchObject({ pocket: 'office', target: 'office' });
    expect(resolve('idle', 400, 200, max).y).toBe(DROP);
  });

  it('idle: no dip away from the right end', () => {
    const r = resolve('idle', max - END - 10, 60, max);
    expect(r).toEqual({ x: max - END - 10, y: 0, pocket: undefined, target: undefined });
    expect(resolve('idle', 0, -50, max).y).toBe(0);
  });

  it('running: left end stops, a dip there stops with the legal break', () => {
    expect(resolve('running', -max, 0, max)).toMatchObject({ x: 0, target: 'stop' });
    expect(resolve('running', -400, DIP, max)).toMatchObject({
      pocket: 'legal',
      target: 'stopLegal',
    });
    expect(resolve('running', -100, 0, max).target).toBeUndefined();
  });

  it('running: without a legal break to add the left dip is a plain stop', () => {
    expect(resolve('running', -400, 60, max, false)).toMatchObject({
      y: 0,
      pocket: undefined,
      target: 'stop',
    });
  });

  it('running: down from the right starts lunch', () => {
    expect(resolve('running', 0, 10, max)).toMatchObject({ pocket: 'lunch', target: undefined });
    expect(resolve('running', -5, 50, max)).toMatchObject({ x: max - 5, target: 'lunch' });
    expect(resolve('running', -40, 50, max)).toMatchObject({ y: 0, target: undefined });
  });

  it('lunch: up into the track resumes', () => {
    expect(resolve('lunch', 30, 0, max)).toMatchObject({ x: max, y: DROP, target: undefined });
    expect(resolve('lunch', 0, -20, max).target).toBeUndefined();
    expect(resolve('lunch', 0, -50, max)).toMatchObject({ y: DROP - 50, target: 'resume' });
    expect(resolve('lunch', 0, -200, max).y).toBe(0);
  });
});
