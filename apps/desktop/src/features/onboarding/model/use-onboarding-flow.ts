import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LotRule, Sphere } from '@dm/shared';
import { useProfile, useCompleteOnboarding } from '../../profile/model/use-profile';
import { useLots, useCreateLot, type LotInput } from '../../lot/model/use-lots';
import { useGsiConfig, type GsiCheckResult } from './use-gsi-config';
import { getOnboardingStep, type OnboardingStep } from '../domain/steps';

export type OnboardingFlow = {
  step: OnboardingStep;
  isInitialLoading: boolean;
  submitDebtThreshold: (value: number) => void;
  submitStartingBalance: (value: number) => void;
  savingProfile: boolean;
  submitLot: (input: { name: string; sphere: Sphere; reward: number; rules: LotRule[] }) => void;
  creatingLot: boolean;
  gsi: GsiCheckResult | null;
  gsiChecking: boolean;
  recheckGsi: () => void;
  skipToDashboard: () => void;
};

export const useOnboardingFlow = (): OnboardingFlow => {
  const navigate = useNavigate();
  const profile = useProfile();
  const lots = useLots();
  const gsi = useGsiConfig();
  const complete = useCompleteOnboarding();
  const create = useCreateLot();
  const [debtThreshold, setDebtThreshold] = useState<number | null>(null);
  const [balanceSet, setBalanceSet] = useState(false);

  const completed = profile.data?.onboardingCompleted ?? false;
  const step: OnboardingStep = completed
    ? 'complete'
    : getOnboardingStep({
        hasDebtThreshold: debtThreshold !== null,
        hasStartingBalance: balanceSet,
        lotsCount: lots.data?.length ?? 0,
        gsiReady: gsi.result?.status === 'ok' || gsi.result?.status === 'written',
      });

  useEffect(() => {
    if (step === 'complete' && completed) navigate('/dashboard', { replace: true });
  }, [step, completed, navigate]);

  return {
    step,
    isInitialLoading: profile.isPending,
    submitDebtThreshold: (v) => setDebtThreshold(v),
    submitStartingBalance: (v) =>
      complete.mutate(
        { debtThreshold: debtThreshold ?? 0, startingBalance: v },
        { onSuccess: () => setBalanceSet(true) },
      ),
    savingProfile: complete.isPending,
    submitLot: (input: LotInput) => create.mutate(input),
    creatingLot: create.isPending,
    gsi: gsi.result,
    gsiChecking: gsi.checking,
    recheckGsi: gsi.recheck,
    skipToDashboard: () => navigate('/dashboard'),
  };
};
