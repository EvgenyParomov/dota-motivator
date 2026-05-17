import { DomainError } from '../../../shared/lib/errors.js';

export class LotArchivedError extends DomainError {
  constructor() {
    super('LOT_ARCHIVED', 'lot is archived');
    this.name = 'LotArchivedError';
  }
}
