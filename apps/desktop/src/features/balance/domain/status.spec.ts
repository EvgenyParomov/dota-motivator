import { describe, expect, it } from 'vitest';
import { getBalanceStatus } from './status';

describe('Главный экран', () => {
  describe('Dashboard state domain', () => {
    it('getBalanceStatus возвращает ok когда balance > 0', () => {
      expect(getBalanceStatus(5, 0)).toBe('ok');
    });
    it('getBalanceStatus возвращает debt когда -debtThreshold < balance <= 0', () => {
      expect(getBalanceStatus(0, 3)).toBe('debt');
      expect(getBalanceStatus(-2, 3)).toBe('debt');
    });
    it('getBalanceStatus возвращает blocked когда balance <= -debtThreshold', () => {
      expect(getBalanceStatus(-3, 3)).toBe('blocked');
      expect(getBalanceStatus(-4, 3)).toBe('blocked');
    });
  });
});
