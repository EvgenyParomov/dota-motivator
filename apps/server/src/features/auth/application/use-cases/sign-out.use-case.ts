import { inject, injectable } from 'inversify';
import { SessionIssuer } from '../ports/session-issuer.js';

@injectable()
export class SignOutUseCase {
  constructor(@inject(SessionIssuer) private readonly sessions: SessionIssuer) {}

  async execute(token: string): Promise<void> {
    await this.sessions.revoke(token);
  }
}
