import type { ReactNode } from 'react';
import type { OnboardingStep } from '../domain/steps';
import { OnboardingStepper } from './onboarding-stepper';

type Props = {
  step: OnboardingStep;
  body: ReactNode;
};

export const OnboardingLayout = ({ step, body }: Props) => (
  <div className="flex flex-col gap-6">
    <header>
      <h1 className="text-2xl font-semibold tracking-tight">Онбординг</h1>
      <p className="text-muted-foreground text-sm">
        Пара шагов — и можно начинать играть осознанно.
      </p>
    </header>
    <OnboardingStepper current={step} />
    {body}
  </div>
);
