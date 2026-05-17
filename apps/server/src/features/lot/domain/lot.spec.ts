import { describe, expect, it } from 'vitest';
import { validateAndNormalize, validateRules } from './lot.js';

describe('Лоты', () => {
  describe('Lot domain', () => {
    it('лот с пустым name отклоняется', () => {
      expect(() =>
        validateAndNormalize({ name: '   ', sphere: 'health', reward: 1, rules: [] }),
      ).toThrow();
    });

    it('лот с reward <= 0 отклоняется', () => {
      expect(() =>
        validateAndNormalize({ name: 'run', sphere: 'health', reward: 0, rules: [] }),
      ).toThrow();
      expect(() =>
        validateAndNormalize({ name: 'run', sphere: 'health', reward: -1, rules: [] }),
      ).toThrow();
    });

    it('лот с reward больше MAX_REWARD (10) отклоняется', () => {
      expect(() =>
        validateAndNormalize({ name: 'run', sphere: 'health', reward: 11, rules: [] }),
      ).toThrow();
    });

    it('лот без правил валиден', () => {
      const draft = validateAndNormalize({
        name: 'run',
        sphere: 'health',
        reward: 1,
        rules: [],
      });
      expect(draft.rules).toEqual([]);
    });

    it('лот с конфликтующими правилами OneTime и DailyLimit отклоняется', () => {
      expect(() =>
        validateAndNormalize({
          name: 'doctor',
          sphere: 'health',
          reward: 1,
          rules: [{ type: 'one-time' }, { type: 'daily-limit', count: 1 }],
        }),
      ).toThrow();
    });
  });

  describe('Rule validation', () => {
    it('DailyLimit с count <= 0 отклоняется', () => {
      expect(() => validateRules([{ type: 'daily-limit', count: 0 }])).toThrow();
    });

    it('WeeklyLimit с count <= 0 отклоняется', () => {
      expect(() => validateRules([{ type: 'weekly-limit', count: -1 }])).toThrow();
    });

    it('Cooldown с отрицательной продолжительностью отклоняется', () => {
      expect(() => validateRules([{ type: 'cooldown', minutes: -1 }])).toThrow();
    });

    it('OneTime не имеет параметров', () => {
      expect(() => validateRules([{ type: 'one-time' }])).not.toThrow();
    });
  });
});
