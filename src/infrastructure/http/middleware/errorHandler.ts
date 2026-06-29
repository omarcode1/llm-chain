import { NextFunction, Request, Response } from 'express';
import { DomainError } from '../../../domain/errors/DomainError';
import { JiraTicketNotFoundError } from '../../../domain/errors/JiraTicketNotFoundError';
import { SessionNotFoundError } from '../../../domain/errors/SessionNotFoundError';

/**
 * Maps domain and validation errors to JSON responses; unknown errors become 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof JiraTicketNotFoundError || err instanceof SessionNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  if (message.includes('required') || message.includes('not configured')) {
    res.status(400).json({ error: message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
