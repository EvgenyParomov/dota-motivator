import type { Container } from 'inversify';
import { StatisticsSource } from './application/ports/statistics-source.js';
import { DrizzleStatisticsSource } from './adapters/statistics-source.adapter.js';
import { GetStatisticsUseCase } from './application/use-cases/get-statistics.use-case.js';

export const registerStatistics = (c: Container): void => {
  c.bind(StatisticsSource).to(DrizzleStatisticsSource);
  c.bind(GetStatisticsUseCase).toSelf();
};
