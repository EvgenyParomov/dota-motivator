import { describe, expect, it } from 'vitest';
import { checkRules } from './rules.js';

describe('Выполнение лотов', () => {
  describe('Rule checks', () => {
    it('DailyLimit{count=1} пропускает первое выполнение в день (UTC)', () => {
      const now = new Date('2026-01-15T12:00:00Z');
      const r = checkRules([{ type: 'daily-limit', count: 1 }], [], now);
      expect(r.allowed).toBe(true);
    });

    it('DailyLimit{count=1} отклоняет второе выполнение в тот же день', () => {
      const now = new Date('2026-01-15T20:00:00Z');
      const history = [new Date('2026-01-15T10:00:00Z')];
      const r = checkRules([{ type: 'daily-limit', count: 1 }], history, now);
      expect(r.allowed).toBe(false);
    });

    it('DailyLimit{count=N} пропускает первые N выполнений', () => {
      const now = new Date('2026-01-15T12:00:00Z');
      const history = [new Date('2026-01-15T08:00:00Z')];
      const r = checkRules([{ type: 'daily-limit', count: 2 }], history, now);
      expect(r.allowed).toBe(true);
    });

    it('WeeklyLimit считается по календарной неделе (понедельник—воскресенье UTC)', () => {
      const monday = new Date('2026-01-12T08:00:00Z'); // Mon
      const sunday = new Date('2026-01-18T22:00:00Z'); // Sun
      const r = checkRules([{ type: 'weekly-limit', count: 1 }], [monday], sunday);
      expect(r.allowed).toBe(false);
    });

    it('Cooldown отклоняет выполнение раньше указанного интервала после последнего', () => {
      const last = new Date('2026-01-15T12:00:00Z');
      const now = new Date('2026-01-15T12:30:00Z');
      const r = checkRules([{ type: 'cooldown', minutes: 60 }], [last], now);
      expect(r.allowed).toBe(false);
    });

    it('OneTime отклоняет любое выполнение после первого', () => {
      const r = checkRules(
        [{ type: 'one-time' }],
        [new Date('2026-01-01T00:00:00Z')],
        new Date('2026-12-31T23:59:59Z'),
      );
      expect(r.allowed).toBe(false);
    });
  });

  describe('Rule composition', () => {
    it('все правила лота применяются в AND-логике (любое нарушение блокирует)', () => {
      const now = new Date('2026-01-15T12:00:00Z');
      const history = [new Date('2026-01-15T11:00:00Z')];
      const r = checkRules(
        [
          { type: 'cooldown', minutes: 30 },
          { type: 'daily-limit', count: 5 },
        ],
        history,
        now,
      );
      expect(r.allowed).toBe(true);
      const r2 = checkRules(
        [
          { type: 'cooldown', minutes: 90 },
          { type: 'daily-limit', count: 5 },
        ],
        history,
        now,
      );
      expect(r2.allowed).toBe(false);
    });

    it('при нарушении возвращается описание первого сработавшего правила', () => {
      const r = checkRules(
        [{ type: 'one-time' }],
        [new Date('2026-01-01T00:00:00Z')],
        new Date('2026-12-31T23:59:59Z'),
      );
      expect(r.allowed).toBe(false);
      if (!r.allowed) {
        expect(r.rule).toBe('one-time');
        expect(r.reason).toContain('уже');
      }
    });
  });
});
