import type { LotId, UserId } from '@dm/shared';
import type {
  CreateLotData,
  LotEntity,
  UpdateLotData,
} from '../../domain/lot-entity.js';

export abstract class LotRepository {
  abstract create(data: CreateLotData): Promise<LotEntity>;
  abstract findById(id: LotId, userId: UserId): Promise<LotEntity | null>;
  abstract update(id: LotId, userId: UserId, data: UpdateLotData): Promise<LotEntity | null>;
  abstract archive(id: LotId, userId: UserId): Promise<void>;
  abstract listActive(userId: UserId): Promise<LotEntity[]>;
}
