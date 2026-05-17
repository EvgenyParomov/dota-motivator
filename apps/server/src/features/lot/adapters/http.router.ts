import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';
import { requireAuth } from '../../../app/auth-middleware.js';
import { CreateLotUseCase } from '../application/use-cases/create-lot.use-case.js';
import { UpdateLotUseCase } from '../application/use-cases/update-lot.use-case.js';
import { ArchiveLotUseCase } from '../application/use-cases/archive-lot.use-case.js';
import { ListLotsUseCase } from '../application/use-cases/list-lots.use-case.js';
import { GetLotUseCase } from '../application/use-cases/get-lot.use-case.js';
import { ValidationError } from '../../../shared/lib/errors.js';

const RuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily-limit'), count: z.number().int().positive() }),
  z.object({ type: z.literal('weekly-limit'), count: z.number().int().positive() }),
  z.object({ type: z.literal('cooldown'), minutes: z.number().nonnegative() }),
  z.object({ type: z.literal('one-time') }),
]);

const LotBody = z.object({
  name: z.string(),
  sphere: z.string(),
  reward: z.number(),
  rules: z.array(RuleSchema).default([]),
  iconMediaKey: z.string().nullable().optional(),
});

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string =>
  req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';

export const buildLotRouter = (container: Container) => {
  const router = Router();

  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const parsed = LotBody.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.message);
      const lot = await container.get(CreateLotUseCase).execute(userIdOf(req), parsed.data);
      res.status(201).json(lot);
    } catch (e) {
      next(e);
    }
  });

  router.patch('/:id', requireAuth, async (req, res, next) => {
    try {
      const parsed = LotBody.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.message);
      const lot = await container
        .get(UpdateLotUseCase)
        .execute(req.params.id!, userIdOf(req), parsed.data);
      res.json(lot);
    } catch (e) {
      next(e);
    }
  });

  router.post('/:id/archive', requireAuth, async (req, res, next) => {
    try {
      await container.get(ArchiveLotUseCase).execute(req.params.id!, userIdOf(req));
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const lots = await container.get(ListLotsUseCase).execute(userIdOf(req));
      res.json(lots);
    } catch (e) {
      next(e);
    }
  });

  router.get('/:id', requireAuth, async (req, res, next) => {
    try {
      const lot = await container.get(GetLotUseCase).execute(req.params.id!, userIdOf(req));
      res.json(lot);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
