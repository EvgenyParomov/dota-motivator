export type OnboardingStep = 'profile' | 'balance' | 'lots' | 'gsi' | 'complete';

export type OnboardingState = {
  hasDebtThreshold: boolean;
  hasStartingBalance: boolean;
  lotsCount: number;
  gsiReady: boolean;
};

export const getOnboardingStep = (s: OnboardingState): OnboardingStep => {
  if (!s.hasDebtThreshold) return 'profile';
  if (!s.hasStartingBalance) return 'balance';
  if (s.lotsCount === 0) return 'lots';
  if (!s.gsiReady) return 'gsi';
  return 'complete';
};
