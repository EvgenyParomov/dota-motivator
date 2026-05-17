import { describe, expect, it } from 'vitest';
import { parsePeriod, rangeForPeriod } from './period.js';

describe('Статистика', () => {
  describe('Period parsing', () => {
    it('period=week возвращает диапазон с понедельника текущей недели UTC', () => {
      const now = new Date('2026-01-15T12:00:00Z'); // Thursday
      const r = rangeForPeriod('week', now, new Date('2025-01-01'));
      expect(r.from.toISOString()).toBe('2026-01-12T00:00:00.000Z');
    });

    it('period=month возвращает диапазон с первого числа текущего месяца UTC', () => {
      const now = new Date('2026-03-15T12:00:00Z');
      const r = rangeForPeriod('month', now, new Date('2025-01-01'));
      expect(r.from.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    });

    it('period=all возвращает диапазон от createdAt пользователя до сейчас', () => {
      const createdAt = new Date('2025-06-01T00:00:00Z');
      const now = new Date('2026-01-15T12:00:00Z');
      const r = rangeForPeriod('all', now, createdAt);
      expect(r.from.toISOString()).toBe('2025-06-01T00:00:00.000Z');
    });

    it('невалидный period возвращает доменную ошибку InvalidPeriod', () => {
      expect(() => parsePeriod('bogus')).toThrow();
    });
  });
});
