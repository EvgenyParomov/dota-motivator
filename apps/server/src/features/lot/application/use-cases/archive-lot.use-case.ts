import { inject, injectable } from 'inversify';
import type { LotId, UserId } from '@dm/shared';
import { LotRepository } from '../ports/lot-repository.js';
import { NotFoundError } from '../../../../shared/lib/errors.js';

@injectable()
export class ArchiveLotUseCase {
  constructor(@inject(LotRepository) private readonly repo: LotRepository) {}

  async execute(id: LotId, userId: UserId): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('lot');
    await this.repo.archive(id, userId);
  }
}
