import { dayTarget } from './calendar.ts';
import { workedOn } from './entries.ts';
import { eachDay, periodRange } from './time.ts';
import type { Dataset, ISODate, Instant, Period } from './types.ts';

export interface Balance {
  target: number;
  worked: number;
  /** Minutes still to work in the period (negative = overtime). */
  remaining: number;
}

export function balanceBetween(
  ds: Dataset,
  from: ISODate,
  to: ISODate,
  holidays: ReadonlySet<ISODate>,
  now: Instant,
): Balance {
  let target = 0;
  let worked = 0;
  for (const d of eachDay(from, to)) {
    target += dayTarget(ds, d, holidays);
    worked += workedOn(ds, d, now);
  }
  return { target, worked, remaining: target - worked };
}

export function balance(
  ds: Dataset,
  period: Period,
  today: ISODate,
  holidays: ReadonlySet<ISODate>,
  now: Instant,
): Balance {
  const { from, to } = periodRange(period, today);
  return balanceBetween(ds, from, to, holidays, now);
}

/** How full a period is: share of the target worked (capped at 1) and whether it's overtime. */
export function dayProgress(b: Balance): { ratio: number; over: boolean } {
  const ratio = b.target > 0 ? Math.min(1, b.worked / b.target) : b.worked > 0 ? 1 : 0;
  return { ratio, over: b.remaining < 0 };
}
