import type { UserId } from '@dm/shared';
import type { User } from '../../domain/user.js';

export type CreateUserInput = {
  id: UserId;
  steamId: string;
  personaName: string;
  avatarUrl: string;
  now: Date;
};

export type UpdateUserOnLoginInput = {
  personaName: string;
  avatarUrl: string;
  lastLoginAt: Date;
};

export abstract class UserRepository {
  abstract findBySteamId(steamId: string): Promise<User | null>;
  abstract findById(id: UserId): Promise<User | null>;
  abstract create(input: CreateUserInput): Promise<User>;
  abstract updateOnLogin(id: UserId, input: UpdateUserOnLoginInput): Promise<void>;
}
