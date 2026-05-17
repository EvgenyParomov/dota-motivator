import type { AuthState } from '../../domain/auth-state.js';

export abstract class AuthStateStore {
  abstract save(state: AuthState): Promise<void>;
  abstract consume(state: string, now: Date): Promise<AuthState | null>;
}
