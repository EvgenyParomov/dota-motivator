import type { RequestHandler } from 'express';
import type { Container } from 'inversify';
import { SessionResolver } from '../shared/application/ports/session-resolver.js';
import type { AuthContext } from '@dm/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authContext?: AuthContext;
    }
  }
}

export const authMiddleware = (container: Container): RequestHandler => {
  const resolver = container.get(SessionResolver);
  return async (req, _res, next) => {
    req.authContext = await resolver.resolve(req.headers);
    next();
  };
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.authContext?.kind !== 'authenticated') {
    res.status(401).json({ error: 'authentication required' });
    return;
  }
  next();
};
