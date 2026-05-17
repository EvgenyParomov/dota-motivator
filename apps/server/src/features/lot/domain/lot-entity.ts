import type { LotId, UserId, LotRule, Sphere } from '@dm/shared';

export type LotEntity = {
  id: LotId;
  userId: UserId;
  name: string;
  sphere: Sphere;
  reward: number;
  rules: LotRule[];
  iconMediaKey: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateLotData = {
  userId: UserId;
  name: string;
  sphere: Sphere;
  reward: number;
  rules: LotRule[];
  iconMediaKey: string | null;
};

export type UpdateLotData = Partial<Omit<CreateLotData, 'userId'>>;
