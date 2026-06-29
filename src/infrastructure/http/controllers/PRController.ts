import { Request, Response } from 'express';
import type { GeneratePRDto } from '../../../application/dto/GeneratePRDto';
import type { IngestDocumentsDto } from '../../../application/dto/IngestDocumentsDto';
import type { RefinePRDto } from '../../../application/dto/RefinePRDto';
import { GeneratePRDescriptionUseCase } from '../../../application/use-cases/GeneratePRDescription';
import { IngestDocumentsUseCase } from '../../../application/use-cases/IngestDocuments';
import {
  GetPRSessionUseCase,
  RefinePRDescriptionUseCase,
} from '../../../application/use-cases/RefinePRDescription';

/**
 * HTTP controller for PR generation, refinement, and document ingestion.
 */
export class PRController {
  constructor(
    private readonly generatePR: GeneratePRDescriptionUseCase,
    private readonly refinePR: RefinePRDescriptionUseCase,
    private readonly getSession: GetPRSessionUseCase,
    private readonly ingestDocuments: IngestDocumentsUseCase,
  ) {}

  /**
   * Generates a PR description from Jira ticket and git diff.
   *
   * @route  POST /api/v1/pr/generate
   * @access Public
   */
  async generate(req: Request, res: Response): Promise<void> {
    const body = req.body as GeneratePRDto;
    if (!body.jiraKey) {
      res.status(400).json({ error: 'jiraKey is required' });
      return;
    }
    const result = await this.generatePR.execute(body);
    res.status(201).json(result);
  }

  /**
   * Refines an existing PR draft using chat memory.
   *
   * @route  POST /api/v1/pr/refine
   * @access Public
   */
  async refine(req: Request, res: Response): Promise<void> {
    const body = req.body as RefinePRDto;
    if (!body.sessionId || !body.message) {
      res.status(400).json({ error: 'sessionId and message are required' });
      return;
    }
    const result = await this.refinePR.execute(body);
    res.status(200).json(result);
  }

  /**
   * Retrieves a PR refinement session with chat history.
   *
   * @route  GET /api/v1/pr/sessions/:id
   * @access Public
   */
  async getPRSession(req: Request, res: Response): Promise<void> {
    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!sessionId) {
      res.status(400).json({ error: 'session id is required' });
      return;
    }
    const result = this.getSession.execute(sessionId);
    res.status(200).json(result);
  }

  /**
   * Ingests documents into the vector store for RAG retrieval.
   *
   * @route  POST /api/v1/documents/ingest
   * @access Public
   */
  async ingest(req: Request, res: Response): Promise<void> {
    const body = req.body as IngestDocumentsDto;
    if (!body.source) {
      res.status(400).json({ error: 'source is required (fixture|jira|url|text)' });
      return;
    }
    const result = await this.ingestDocuments.execute(body);
    res.status(201).json(result);
  }
}
