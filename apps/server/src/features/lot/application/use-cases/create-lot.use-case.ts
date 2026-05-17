import { inject, injectable } from 'inversify';
import type { UserId, Sphere } from '@dm/shared';
import { LotRepository } from '../ports/lot-repository.js';
import type { LotEntity } from '../../domain/lot-entity.js';
import { validateAndNormalize, type NewLotInput } from '../../domain/lot.js';

@injectable()
export class CreateLotUseCase {
  constructor(@inject(LotRepository) private readonly repo: LotRepository) {}

  async execute(userId: UserId, input: NewLotInput): Promise<LotEntity> {
    const draft = validateAndNormalize(input);
    return this.repo.create({
      userId,
      name: draft.name,
      sphere: draft.sphere as Sphere,
      reward: draft.reward,
      rules: draft.rules,
      iconMediaKey: draft.iconMediaKey,
    });
  }
}
