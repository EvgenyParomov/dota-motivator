export class DomainError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(what: string) {
    super('NOT_FOUND', `${what} not found`);
  }
}

export class UnauthorizedError extends DomainError {
  constructor() {
    super('UNAUTHORIZED', 'authentication required');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION', message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', message);
  }
}

export class RuleViolationError extends DomainError {
  constructor(public readonly reason: string) {
    super('RULE_VIOLATION', reason);
  }
}

export const errorToHttpStatus = (e: unknown): number => {
  if (!(e instanceof DomainError)) return 500;
  switch (e.code) {
    case 'NOT_FOUND': return 404;
    case 'UNAUTHORIZED': return 401;
    case 'VALIDATION': return 400;
    case 'CONFLICT': return 409;
    case 'RULE_VIOLATION': return 422;
    case 'PAYLOAD_TOO_LARGE': return 413;
    case 'LOT_ARCHIVED': return 410;
    case 'INVALID_STEAM_RESPONSE': return 401;
    case 'INVALID_STATE': return 400;
    case 'INVALID_CLIENT_CALLBACK': return 400;
    default: return 500;
  }
};
