import { inject, injectable } from 'inversify';
import type { LotId, UserId, Sphere } from '@dm/shared';
import { LotRepository } from '../ports/lot-repository.js';
import type { LotEntity } from '../../domain/lot-entity.js';
import { validateAndNormalize, type NewLotInput } from '../../domain/lot.js';
import { NotFoundError } from '../../../../shared/lib/errors.js';

@injectable()
export class UpdateLotUseCase {
  constructor(@inject(LotRepository) private readonly repo: LotRepository) {}

  async execute(id: LotId, userId: UserId, input: NewLotInput): Promise<LotEntity> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw new NotFoundError('lot');
    const draft = validateAndNormalize(input);
    const updated = await this.repo.update(id, userId, {
      name: draft.name,
      sphere: draft.sphere as Sphere,
      reward: draft.reward,
      rules: draft.rules,
      iconMediaKey: draft.iconMediaKey,
    });
    if (!updated) throw new NotFoundError('lot');
    return updated;
  }
}
