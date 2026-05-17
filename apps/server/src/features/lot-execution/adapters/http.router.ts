import { Router } from 'express';
import type { Container } from 'inversify';
import { requireAuth } from '../../../app/auth-middleware.js';
import { ExecuteLotUseCase } from '../application/use-cases/execute-lot.use-case.js';
import { ListLotExecutionsUseCase } from '../application/use-cases/list-lot-executions.use-case.js';

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string =>
  req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';

export const buildLotExecutionRouter = (container: Container) => {
  const router = Router();

  // POST /lots/:id/execute is mounted under /lots in app/index.ts? No — kept here.
  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const lotId = typeof req.query.lotId === 'string' ? req.query.lotId : undefined;
      const list = await container
        .get(ListLotExecutionsUseCase)
        .execute(userIdOf(req), lotId ? { lotId } : undefined);
      res.json(list);
    } catch (e) {
      next(e);
    }
  });

  return router;
};

export const buildExecuteOnLotRouter = (container: Container) => {
  const router = Router();
  router.post('/:id/execute', requireAuth, async (req, res, next) => {
    try {
      const result = await container
        .get(ExecuteLotUseCase)
        .execute(req.params.id!, userIdOf(req));
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  });
  return router;
};
