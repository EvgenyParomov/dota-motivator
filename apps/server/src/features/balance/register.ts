import type { Container } from 'inversify';
import { BalanceMutator } from '../../shared/application/ports/balance-mutator.js';
import { BalanceInitializer } from '../../shared/application/ports/balance-initializer.js';
import { BalanceReader } from '../../shared/application/ports/balance-reader.js';
import { BalanceRepository } from './application/ports/balance-repository.js';
import { DrizzleBalanceRepository } from './adapters/balance-repository.adapter.js';
import { BalanceMutatorService } from './application/services/balance-mutator.service.js';
import { BalanceInitializerService } from './application/services/balance-initializer.service.js';
import { BalanceReaderService } from './application/services/balance-reader.service.js';
import { GetBalanceUseCase } from './application/use-cases/get-balance.use-case.js';
import { ListBalanceEventsUseCase } from './application/use-cases/list-balance-events.use-case.js';

export const registerBalance = (c: Container): void => {
  c.bind(BalanceRepository).to(DrizzleBalanceRepository);

  c.bind(BalanceMutator).to(BalanceMutatorService);
  c.bind(BalanceInitializer).to(BalanceInitializerService);
  c.bind(BalanceReader).to(BalanceReaderService);

  c.bind(GetBalanceUseCase).toSelf();
  c.bind(ListBalanceEventsUseCase).toSelf();
};
