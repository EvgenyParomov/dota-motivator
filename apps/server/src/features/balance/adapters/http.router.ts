import { Router } from 'express';
import type { Container } from 'inversify';
import { requireAuth } from '../../../app/auth-middleware.js';
import { GetBalanceUseCase } from '../application/use-cases/get-balance.use-case.js';
import { ListBalanceEventsUseCase } from '../application/use-cases/list-balance-events.use-case.js';

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string =>
  req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';

const parseDate = (s: unknown): Date | undefined => {
  if (typeof s !== 'string') return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
};

export const buildBalanceRouter = (container: Container) => {
  const router = Router();

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const view = await container.get(GetBalanceUseCase).execute(userIdOf(req));
      res.json(view);
    } catch (e) {
      next(e);
    }
  });

  router.get('/events', requireAuth, async (req, res, next) => {
    try {
      const events = await container.get(ListBalanceEventsUseCase).execute(userIdOf(req), {
        from: parseDate(req.query.from),
        to: parseDate(req.query.to),
      });
      res.json(events);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
