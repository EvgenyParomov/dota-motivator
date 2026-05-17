import { Router } from 'express';
import type { Container } from 'inversify';
import { StartSteamLoginUseCase } from '../application/use-cases/start-steam-login.use-case.js';
import { HandleSteamCallbackUseCase } from '../application/use-cases/handle-steam-callback.use-case.js';
import { SignOutUseCase } from '../application/use-cases/sign-out.use-case.js';
import { GetMeUseCase } from '../application/use-cases/get-me.use-case.js';
import { requireAuth } from '../../../app/auth-middleware.js';
import { ValidationError } from '../../../shared/lib/errors.js';

export const buildAuthRouter = (container: Container) => {
  const router = Router();

  router.get('/steam/start', async (req, res, next) => {
    try {
      const clientCallback = String(req.query.client_callback ?? '');
      if (!clientCallback) throw new ValidationError('client_callback required');
      const usecase = container.get(StartSteamLoginUseCase);
      const { redirectUrl } = await usecase.execute(clientCallback);
      res.redirect(302, redirectUrl);
    } catch (e) {
      next(e);
    }
  });

  router.get('/steam/callback', async (req, res, next) => {
    try {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(req.query)) {
        if (typeof v === 'string') params.set(k, v);
      }
      const usecase = container.get(HandleSteamCallbackUseCase);
      const { redirectUrl } = await usecase.execute(params);
      res.redirect(302, redirectUrl);
    } catch (e) {
      next(e);
    }
  });

  router.post('/sign-out', requireAuth, async (req, res, next) => {
    try {
      const header = req.headers.authorization ?? '';
      const m = /^Bearer\s+(.+)$/i.exec(header);
      if (!m || !m[1]) {
        res.status(204).end();
        return;
      }
      await container.get(SignOutUseCase).execute(m[1]);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  router.get('/me', requireAuth, async (req, res, next) => {
    try {
      const ctx = req.authContext;
      const userId = ctx?.kind === 'authenticated' ? ctx.userId : '';
      const user = await container.get(GetMeUseCase).execute(userId);
      res.json(user);
    } catch (e) {
      next(e);
    }
  });

  return router;
};
