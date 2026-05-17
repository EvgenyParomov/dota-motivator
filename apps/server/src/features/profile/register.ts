import type { Container } from 'inversify';
import { ProfileInitializer } from '../../shared/application/ports/profile-initializer.js';
import { ProfileReader } from '../../shared/application/ports/profile-reader.js';
import { ProfileRepository } from './application/ports/profile-repository.js';
import { DrizzleProfileRepository } from './adapters/profile-repository.adapter.js';
import { ProfileInitializerService } from './application/services/profile-initializer.service.js';
import { ProfileReaderService } from './application/services/profile-reader.service.js';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case.js';
import { SetDebtThresholdUseCase } from './application/use-cases/set-debt-threshold.use-case.js';
import { CompleteOnboardingUseCase } from './application/use-cases/complete-onboarding.use-case.js';

export const registerProfile = (c: Container): void => {
  c.bind(ProfileRepository).to(DrizzleProfileRepository);

  c.bind(ProfileInitializer).to(ProfileInitializerService);
  c.bind(ProfileReader).to(ProfileReaderService);

  c.bind(GetProfileUseCase).toSelf();
  c.bind(SetDebtThresholdUseCase).toSelf();
  c.bind(CompleteOnboardingUseCase).toSelf();
};
