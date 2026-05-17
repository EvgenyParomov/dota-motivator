import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';
import { requireAuth } from '../../../app/auth-middleware.js';
import { GetProfileUseCase } from '../application/use-cases/get-profile.use-case.js';
import { SetDebtThresholdUseCase } from '../application/use-cases/set-debt-threshold.use-case.js';
import { CompleteOnboardingUseCase } from '../application/use-cases/complete-onboarding.use-case.js';
import { ValidationError } from '../../../shared/lib/errors.js';

const PatchBody = z.object({ debtThreshold: z.number() });
const CompleteBody = z.object({ debtThreshold: z.number(), startingBalance: z.number() });

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string => {
  return req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';
};

export const buildProfileRouter = (container: Container) => {
  const router = Router();

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const profile = await container.get(GetProfileUseCase).execute(userIdOf(req));
      res.json(profile);
    } catch (e) {
      next(e);
    }
  });

  router.patch('/', requireAuth, async (req, res, next) => {
    try {
      const parsed = PatchBody.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.message);
      await container.get(SetDebtThresholdUseCase).execute(userIdOf(req), parsed.data.debtThreshold);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.post('/complete-onboarding', requireAuth, async (req, res, next) => {
    try {
      const parsed = CompleteBody.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.message);
      await container.get(CompleteOnboardingUseCase).execute(userIdOf(req), parsed.data);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
};
