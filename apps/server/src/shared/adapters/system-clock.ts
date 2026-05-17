import { injectable } from 'inversify';
import { Clock } from '../application/ports/clock.js';

@injectable()
export class SystemClock extends Clock {
  override now(): Date {
    return new Date();
  }
}
