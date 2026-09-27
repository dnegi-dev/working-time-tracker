import type { Repository } from '../../ports/index.ts';

/**
 * Placeholder for a future database backend (see docs/dev/adr/0003-storage.md).
 * Implement `Repository` against a server API and wire it in `src/main.ts`.
 */
export function dbRepo(): Repository {
  throw new Error('Database storage is not implemented yet');
}
