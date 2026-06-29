import { DomainError } from './DomainError';

/**
 * Raised when a Jira ticket cannot be found or fetched.
 */
export class JiraTicketNotFoundError extends DomainError {
  constructor(jiraKey: string, options?: { cause?: unknown }) {
    super(`Jira ticket not found: ${jiraKey}`, options);
  }
}
