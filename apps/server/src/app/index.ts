import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import type { Container } from 'inversify';
import { AuthToken } from './tokens.js';
import type { Auth } from '../shared/adapters/better-auth.js';
import { authMiddleware } from './auth-middleware.js';
import { httpErrorHandler } from './http-error.js';

import { buildAuthRouter } from '../features/auth/adapters/http.router.js';
import { buildProfileRouter } from '../features/profile/adapters/http.router.js';
import { buildBalanceRouter } from '../features/balance/adapters/http.router.js';
import { buildLotRouter } from '../features/lot/adapters/http.router.js';
import {
  buildLotExecutionRouter,
  buildExecuteOnLotRouter,
} from '../features/lot-execution/adapters/http.router.js';
import { buildMediaRouter } from '../features/media/adapters/http.router.js';
import { buildMatchTrackingRouter } from '../features/match-tracking/adapters/http.router.js';
import { buildStatisticsRouter } from '../features/statistics/adapters/http.router.js';

export const buildApp = (container: Container) => {
  const auth = container.get<Auth>(AuthToken);

  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());

  // better-auth handles its own routes; mount BEFORE express.json so it can
  // parse bodies on its own.
  app.all('/api/auth/*', async (req, res) => {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      headers.set(k, Array.isArray(v) ? v.join(', ') : String(v));
    }
    const init: RequestInit = {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : await new Promise<string>((resolve) => {
            const chunks: Buffer[] = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
          }),
    };
    const response = await auth.handler(new Request(url, init));
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(await response.text());
  });

  app.use(express.json({ limit: '64kb' }));
  app.use(authMiddleware(container));

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/auth', buildAuthRouter(container));
  app.use('/profile', buildProfileRouter(container));
  app.use('/balance', buildBalanceRouter(container));
  app.use('/lots', buildLotRouter(container));
  app.use('/lots', buildExecuteOnLotRouter(container));
  app.use('/lot-executions', buildLotExecutionRouter(container));
  app.use('/media', buildMediaRouter(container));
  app.use('/match-events', buildMatchTrackingRouter(container));
  app.use('/statistics', buildStatisticsRouter(container));

  app.use(httpErrorHandler);

  return app;
};
