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
