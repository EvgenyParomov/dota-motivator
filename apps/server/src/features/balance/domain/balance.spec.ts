import { describe, expect, it } from 'vitest';
import { applyCredit, applyDebit, canPlayMore } from './balance.js';

describe('Баланс каток', () => {
  describe('Balance domain', () => {
    it('applyCredit увеличивает баланс на сумму события', () => {
      expect(applyCredit(5, 2)).toBe(7);
      expect(applyCredit(0, 0.5)).toBe(0.5);
    });

    it('applyDebit уменьшает баланс на сумму события', () => {
      expect(applyDebit(5, 2)).toBe(3);
      expect(applyDebit(0, 1)).toBe(-1);
    });

    it('canPlayMore возвращает true когда balance > -debtThreshold', () => {
      expect(canPlayMore(1, 0)).toBe(true);
      expect(canPlayMore(-2, 3)).toBe(true);
    });

    it('canPlayMore возвращает false когда balance <= -debtThreshold', () => {
      expect(canPlayMore(0, 0)).toBe(false);
      expect(canPlayMore(-3, 3)).toBe(false);
      expect(canPlayMore(-4, 3)).toBe(false);
    });
  });
});
