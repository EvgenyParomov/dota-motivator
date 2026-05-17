import { inject, injectable } from 'inversify';
import type { UserId } from '@dm/shared';
import { UserRepository } from '../ports/user-repository.js';
import type { User } from '../../domain/user.js';
import { NotFoundError } from '../../../../shared/lib/errors.js';

@injectable()
export class GetMeUseCase {
  constructor(@inject(UserRepository) private readonly users: UserRepository) {}

  async execute(userId: UserId): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('user');
    return user;
  }
}
