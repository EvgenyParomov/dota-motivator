import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';
import { requireAuth } from '../../../app/auth-middleware.js';
import { ReportMatchEndUseCase } from '../application/use-cases/report-match-end.use-case.js';
import { CheckPlayDecisionUseCase } from '../application/use-cases/check-play-decision.use-case.js';
import { ListMatchEventsUseCase } from '../application/use-cases/list-match-events.use-case.js';
import { ValidationError } from '../../../shared/lib/errors.js';

const ReportBody = z.object({
  matchId: z.string().min(1),
  phase: z.string(),
  lobbyType: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
});

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string =>
  req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';

export const buildMatchTrackingRouter = (container: Container) => {
  const router = Router();

  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const parsed = ReportBody.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.message);
      const result = await container
        .get(ReportMatchEndUseCase)
        .execute(userIdOf(req), parsed.data);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get('/play-decision', requireAuth, async (req, res, next) => {
    try {
      const result = await container
        .get(CheckPlayDecisionUseCase)
        .execute(userIdOf(req));
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const list = await container.get(ListMatchEventsUseCase).execute(userIdOf(req));
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
