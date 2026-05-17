import type { Container } from 'inversify';
import { LotExecutionHistoryReader } from '../../shared/application/ports/lot-execution-history.js';
import { LotExecutionRepository } from './application/ports/lot-execution-repository.js';
import { DrizzleLotExecutionRepository } from './adapters/lot-execution-repository.adapter.js';
import { LotExecutionHistoryService } from './application/services/lot-execution-history.service.js';
import { ExecuteLotUseCase } from './application/use-cases/execute-lot.use-case.js';
import { ListLotExecutionsUseCase } from './application/use-cases/list-lot-executions.use-case.js';

export const registerLotExecution = (c: Container): void => {
  c.bind(LotExecutionRepository).to(DrizzleLotExecutionRepository);

  c.bind(LotExecutionHistoryReader).to(LotExecutionHistoryService);

  c.bind(ExecuteLotUseCase).toSelf();
  c.bind(ListLotExecutionsUseCase).toSelf();
};
