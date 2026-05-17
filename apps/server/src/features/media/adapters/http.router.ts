import { Router } from 'express';
import type { Container } from 'inversify';
import { z } from 'zod';
import { requireAuth } from '../../../app/auth-middleware.js';
import { PresignUploadUseCase } from '../application/use-cases/presign-upload.use-case.js';
import { ValidationError } from '../../../shared/lib/errors.js';

const PresignBody = z.object({
  mimeType: z.string(),
  size: z.number().int().positive(),
});

const userIdOf = (req: { authContext?: { kind: string; userId?: string } }): string =>
  req.authContext?.kind === 'authenticated' ? req.authContext.userId! : '';

export const buildMediaRouter = (container: Container) => {
  const router = Router();

  router.post('/presign', requireAuth, async (req, res, next) => {
    try {
      const parsed = PresignBody.safeParse(req.body);
      if (!parsed.success) throw new ValidationError(parsed.error.message);
      const result = await container
        .get(PresignUploadUseCase)
        .execute(userIdOf(req), parsed.data);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
