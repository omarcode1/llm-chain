import { Router } from 'express';
import { PRController } from '../controllers/PRController';
import { asyncHandler } from '../middleware/asyncHandler';

/**
 * Creates Express routes for PR generation and document ingestion.
 */
export function createPRRouter(controller: PRController): Router {
  const router = Router();

  router.post(
    '/generate',
    asyncHandler((req, res) => controller.generate(req, res)),
  );
  router.post(
    '/refine',
    asyncHandler((req, res) => controller.refine(req, res)),
  );
  router.get(
    '/sessions/:id',
    asyncHandler((req, res) => controller.getPRSession(req, res)),
  );

  return router;
}

/**
 * Creates Express routes for document ingestion.
 */
export function createDocumentsRouter(controller: PRController): Router {
  const router = Router();

  router.post(
    '/ingest',
    asyncHandler((req, res) => controller.ingest(req, res)),
  );

  return router;
}
