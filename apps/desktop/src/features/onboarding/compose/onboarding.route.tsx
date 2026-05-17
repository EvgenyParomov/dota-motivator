import { PageLoader } from '@/shared/ui/page-loader';
import { useOnboardingFlow } from '../model/use-onboarding-flow';
import { OnboardingLayout } from '../ui/onboarding-layout';
import { DebtThresholdStep } from '../ui/debt-threshold-step';
import { StartingBalanceStep } from '../ui/starting-balance-step';
import { GsiStep } from '../ui/gsi-step';
import { LotForm } from '../../lot/ui/lot-form';

export const OnboardingRoute = () => {
  const flow = useOnboardingFlow();
  if (flow.isInitialLoading) return <PageLoader />;

  const body =
    flow.step === 'profile' ? (
      <DebtThresholdStep onSubmit={flow.submitDebtThreshold} />
    ) : flow.step === 'balance' ? (
      <StartingBalanceStep saving={flow.savingProfile} onSubmit={flow.submitStartingBalance} />
    ) : flow.step === 'lots' ? (
      <LotForm submitting={flow.creatingLot} onSubmit={flow.submitLot} />
    ) : flow.step === 'gsi' ? (
      <GsiStep
        gsi={flow.gsi}
        checking={flow.gsiChecking}
        onRecheck={flow.recheckGsi}
        onSkip={flow.skipToDashboard}
      />
    ) : null;

  return <OnboardingLayout step={flow.step} body={body} />;
};
