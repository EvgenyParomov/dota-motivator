import { Router } from 'express';
import type { Container } from 'inversify';
import { requireAuth } from '../../../app/auth-middleware.js';
import { GetStatisticsUseCase } from '../application/use-cases/get-statistics.use-case.js';

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string =>
  req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';

export const buildStatisticsRouter = (container: Container) => {
  const router = Router();

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const orphanDays = typeof req.query.orphanDays === 'string'
        ? Number(req.query.orphanDays)
        : undefined;
      const stats = await container.get(GetStatisticsUseCase).execute(userIdOf(req), {
        period: req.query.period,
        orphanDays,
      });
      res.json(stats);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
