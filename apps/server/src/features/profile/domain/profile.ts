import type { UserId } from '@dm/shared';
import { ValidationError } from '../../../shared/lib/errors.js';

export type ProfileEntity = {
  userId: UserId;
  debtThreshold: number;
  onboardingCompleted: boolean;
};

export const validateDebtThreshold = (value: number): void => {
  if (!Number.isInteger(value)) {
    throw new ValidationError('debt threshold must be integer');
  }
  if (value < 0) {
    throw new ValidationError('debt threshold must be non-negative');
  }
};

export const validateStartingBalance = (value: number): void => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    throw new ValidationError('starting balance must be a finite number');
  }
};
