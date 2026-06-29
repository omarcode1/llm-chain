import { DomainError } from './DomainError';

/**
 * Raised when a PR refinement session does not exist.
 */
export class SessionNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super(`PR refinement session not found: ${sessionId}`);
  }
}
