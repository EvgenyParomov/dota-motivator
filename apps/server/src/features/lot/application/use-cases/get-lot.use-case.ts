import { inject, injectable } from 'inversify';
import type { LotId, UserId } from '@dm/shared';
import { LotRepository } from '../ports/lot-repository.js';
import type { LotEntity } from '../../domain/lot-entity.js';
import { MediaUrlResolver } from '../../../../shared/application/ports/media-url-resolver.js';
import { NotFoundError } from '../../../../shared/lib/errors.js';

export type LotDetail = LotEntity & { iconUrl: string | null };

@injectable()
export class GetLotUseCase {
  constructor(
    @inject(LotRepository) private readonly repo: LotRepository,
    @inject(MediaUrlResolver) private readonly media: MediaUrlResolver,
  ) {}

  async execute(id: LotId, userId: UserId): Promise<LotDetail> {
    const lot = await this.repo.findById(id, userId);
    if (!lot) throw new NotFoundError('lot');
    const iconUrl = await this.media.resolveReadUrl(lot.iconMediaKey);
    return { ...lot, iconUrl };
  }
}
