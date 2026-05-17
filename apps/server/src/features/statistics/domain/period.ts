import { ValidationError } from '../../../shared/lib/errors.js';
import type { StatPeriod } from '@dm/shared';

export const parsePeriod = (raw: unknown): StatPeriod => {
  if (raw === 'week' || raw === 'month' || raw === 'all') return raw;
  throw new ValidationError(`invalid period: ${raw}`);
};

export const rangeForPeriod = (period: StatPeriod, now: Date, userCreatedAt: Date): { from: Date; to: Date } => {
  const to = new Date(now);
  if (period === 'week') {
    const day = now.getUTCDay() === 0 ? 7 : now.getUTCDay();
    const from = new Date(now);
    from.setUTCHours(0, 0, 0, 0);
    from.setUTCDate(from.getUTCDate() - (day - 1));
    return { from, to };
  }
  if (period === 'month') {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { from, to };
  }
  return { from: userCreatedAt, to };
};
