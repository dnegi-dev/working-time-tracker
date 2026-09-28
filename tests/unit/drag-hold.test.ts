import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOLD_MS, dragHold } from '../../src/ui/bubbles/gesture.ts';

describe('drag and hold', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const enter = vi.fn();
    const confirm = vi.fn();
    const haptic = vi.fn();
    return { enter, confirm, haptic, hold: dragHold({ enter, confirm, haptic }) };
  }

  it('ticks on entering, ramps up while held and confirms after HOLD_MS', () => {
    const { enter, confirm, haptic, hold } = setup();
    hold.over('a');
    expect(enter).toHaveBeenLastCalledWith('a');
    expect(haptic).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(HOLD_MS / 3);
    expect(haptic).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(HOLD_MS / 3);
    expect(haptic).toHaveBeenCalledTimes(3);
    expect(haptic).toHaveBeenCalledWith('tick');
    expect(confirm).not.toHaveBeenCalled();
    vi.advanceTimersByTime(HOLD_MS / 3);
    expect(confirm).toHaveBeenCalledWith('a');
    expect(enter).toHaveBeenLastCalledWith(undefined);
  });

  it('staying on the same target does not restart the hold', () => {
    const { confirm, haptic, hold } = setup();
    hold.over('a');
    vi.advanceTimersByTime(HOLD_MS / 2);
    hold.over('a');
    vi.advanceTimersByTime(HOLD_MS / 2);
    expect(confirm).toHaveBeenCalledWith('a');
    expect(haptic).toHaveBeenCalledTimes(3);
  });

  it('leaving or letting go cancels without further ticks', () => {
    const { confirm, haptic, hold } = setup();
    hold.over('a');
    vi.advanceTimersByTime(HOLD_MS / 2);
    hold.over(undefined);
    hold.over('b');
    hold.end();
    vi.advanceTimersByTime(HOLD_MS * 2);
    expect(confirm).not.toHaveBeenCalled();
    expect(haptic).toHaveBeenCalledTimes(3);
  });
});
