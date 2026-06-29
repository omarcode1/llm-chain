import express from 'express';
import { GeneratePRDescriptionUseCase } from '../../application/use-cases/GeneratePRDescription';
import { IngestDocumentsUseCase } from '../../application/use-cases/IngestDocuments';
import {
  GetPRSessionUseCase,
  RefinePRDescriptionUseCase,
} from '../../application/use-cases/RefinePRDescription';
import { loadEnv } from '../../shared/config/env';
import { createEmbeddings } from '../embeddings/createEmbeddings';
import { createLLMProvider } from '../llm/createLLM';
import { ConversationMemoryStore } from '../memory/ConversationMemory';
import { createVectorStoreRepository } from '../vectorstores/PineconeVectorStoreAdapter';
import { PRController } from './controllers/PRController';
import { errorHandler } from './middleware/errorHandler';
import { createDocumentsRouter, createPRRouter } from './routes/prRoutes';

/**
 * Builds the Express application with PR agent routes and global error handling.
 */
export async function createApp(): Promise<express.Application> {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const config = loadEnv();

  if (config.langchainTracing && config.langchainApiKey) {
    process.env.LANGCHAIN_TRACING_V2 = 'true';
    process.env.LANGCHAIN_API_KEY = config.langchainApiKey;
    process.env.LANGCHAIN_PROJECT = config.langchainProject;
  }

  const embeddings = createEmbeddings(config);
  const vectorStore = await createVectorStoreRepository(config, embeddings);
  const memoryStore = new ConversationMemoryStore();
  const llmProvider = createLLMProvider(config);

  const ingestUseCase = new IngestDocumentsUseCase(vectorStore, config);
  await ingestUseCase.execute({ source: 'fixture' });

  const generatePR = new GeneratePRDescriptionUseCase(
    llmProvider,
    vectorStore,
    config,
    memoryStore,
  );
  const refinePR = new RefinePRDescriptionUseCase(llmProvider, memoryStore);
  const getSession = new GetPRSessionUseCase(memoryStore);

  const controller = new PRController(generatePR, refinePR, getSession, ingestUseCase);

  app.get('/health', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'llmchain-pr-agent',
      version: '1.0.0',
      llmProvider: config.llmProvider,
      vectorStore: config.vectorStoreType,
      endpoints: {
        health: 'GET /health',
        ingest: 'POST /api/v1/documents/ingest',
        generatePR: 'POST /api/v1/pr/generate',
        refinePR: 'POST /api/v1/pr/refine',
        getSession: 'GET /api/v1/pr/sessions/:id',
      },
    });
  });

  app.use('/api/v1/pr', createPRRouter(controller));
  app.use('/api/v1/documents', createDocumentsRouter(controller));

  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      path: req.path,
      method: req.method,
    });
  });

  app.use(errorHandler);

  return app;
}
