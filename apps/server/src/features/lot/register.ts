import type { Container } from 'inversify';
import { LotRepository } from './application/ports/lot-repository.js';
import { DrizzleLotRepository } from './adapters/lot-repository.adapter.js';
import { CreateLotUseCase } from './application/use-cases/create-lot.use-case.js';
import { UpdateLotUseCase } from './application/use-cases/update-lot.use-case.js';
import { ArchiveLotUseCase } from './application/use-cases/archive-lot.use-case.js';
import { ListLotsUseCase } from './application/use-cases/list-lots.use-case.js';
import { GetLotUseCase } from './application/use-cases/get-lot.use-case.js';

export const registerLot = (c: Container): void => {
  c.bind(LotRepository).to(DrizzleLotRepository);

  c.bind(CreateLotUseCase).toSelf();
  c.bind(UpdateLotUseCase).toSelf();
  c.bind(ArchiveLotUseCase).toSelf();
  c.bind(ListLotsUseCase).toSelf();
  c.bind(GetLotUseCase).toSelf();
};
