import { describe, expect, it } from 'vitest';
import { getOnboardingStep } from './steps';

describe('Онбординг', () => {
  describe('OnboardingState domain', () => {
    const base = {
      hasDebtThreshold: false,
      hasStartingBalance: false,
      lotsCount: 0,
      gsiReady: false,
    };
    it('getOnboardingStep возвращает profile пока debtThreshold не задан', () => {
      expect(getOnboardingStep(base)).toBe('profile');
    });
    it('getOnboardingStep возвращает balance после задания debtThreshold', () => {
      expect(getOnboardingStep({ ...base, hasDebtThreshold: true })).toBe('balance');
    });
    it('getOnboardingStep возвращает lots пока не создан ни один лот', () => {
      expect(
        getOnboardingStep({ ...base, hasDebtThreshold: true, hasStartingBalance: true }),
      ).toBe('lots');
    });
    it('getOnboardingStep возвращает gsi если GSI-конфиг не обнаружен', () => {
      expect(
        getOnboardingStep({
          ...base,
          hasDebtThreshold: true,
          hasStartingBalance: true,
          lotsCount: 1,
        }),
      ).toBe('gsi');
    });
    it('getOnboardingStep возвращает complete когда все шаги выполнены', () => {
      expect(
        getOnboardingStep({
          hasDebtThreshold: true,
          hasStartingBalance: true,
          lotsCount: 1,
          gsiReady: true,
        }),
      ).toBe('complete');
    });
  });
});
