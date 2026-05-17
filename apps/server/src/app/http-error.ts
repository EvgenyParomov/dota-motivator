import type { NextFunction, Request, Response } from 'express';
import { DomainError, errorToHttpStatus } from '../shared/lib/errors.js';

export const httpErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof DomainError) {
    res.status(errorToHttpStatus(err)).json({ error: err.code, message: err.message });
    return;
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'INTERNAL', message: 'internal error' });
};
