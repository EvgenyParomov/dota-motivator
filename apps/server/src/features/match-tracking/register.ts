import type { Container } from 'inversify';
import { MatchEventsRepository } from './application/ports/match-events-repository.js';
import { DrizzleMatchEventsRepository } from './adapters/match-events-repository.adapter.js';
import { ReportMatchEndUseCase } from './application/use-cases/report-match-end.use-case.js';
import { CheckPlayDecisionUseCase } from './application/use-cases/check-play-decision.use-case.js';
import { ListMatchEventsUseCase } from './application/use-cases/list-match-events.use-case.js';

export const registerMatchTracking = (c: Container): void => {
  c.bind(MatchEventsRepository).to(DrizzleMatchEventsRepository);

  c.bind(ReportMatchEndUseCase).toSelf();
  c.bind(CheckPlayDecisionUseCase).toSelf();
  c.bind(ListMatchEventsUseCase).toSelf();
};
