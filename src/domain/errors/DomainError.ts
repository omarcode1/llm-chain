/**
 * Base class for expected domain failures (mapped to HTTP by the error middleware).
 */
export abstract class DomainError extends Error {
  public override readonly cause?: unknown;

  protected constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = new.target.name;
    this.cause = options?.cause;
  }
}
