import { DomainError } from '../../../shared/lib/errors.js';

export class InvalidSteamResponseError extends DomainError {
  constructor() {
    super('INVALID_STEAM_RESPONSE', 'Steam OpenID response is not valid');
  }
}

export class InvalidStateError extends DomainError {
  constructor() {
    super('INVALID_STATE', 'auth state is invalid, expired or already used');
  }
}

export class InvalidClientCallbackError extends DomainError {
  constructor() {
    super('INVALID_CLIENT_CALLBACK', 'client_callback is not allowlisted');
  }
}
