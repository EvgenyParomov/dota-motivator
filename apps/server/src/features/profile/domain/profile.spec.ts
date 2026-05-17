import { describe, expect, it } from 'vitest';
import { validateDebtThreshold, validateStartingBalance } from './profile.js';

describe('Профиль пользователя', () => {
  describe('SetDebtThresholdUseCase', () => {
    it('сохраняет неотрицательное целое значение порога', () => {
      expect(() => validateDebtThreshold(0)).not.toThrow();
      expect(() => validateDebtThreshold(5)).not.toThrow();
    });

    it('отрицательное значение отклоняется доменной ошибкой InvalidDebtThreshold', () => {
      expect(() => validateDebtThreshold(-1)).toThrow();
    });

    it('дробное значение отклоняется', () => {
      expect(() => validateDebtThreshold(1.5)).toThrow();
    });
  });

  describe('starting balance validation', () => {
    it('accepts negative starting balance', () => {
      expect(() => validateStartingBalance(-1)).not.toThrow();
    });
    it('accepts zero starting balance', () => {
      expect(() => validateStartingBalance(0)).not.toThrow();
    });
    it('rejects NaN', () => {
      expect(() => validateStartingBalance(Number.NaN)).toThrow();
    });
  });
});
