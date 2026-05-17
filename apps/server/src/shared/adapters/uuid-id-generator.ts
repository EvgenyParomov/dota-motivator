import { randomUUID } from 'node:crypto';
import { injectable } from 'inversify';
import { IdGenerator } from '../application/ports/id-generator.js';

@injectable()
export class UuidIdGenerator extends IdGenerator {
  override generate(): string {
    return randomUUID();
  }
}
