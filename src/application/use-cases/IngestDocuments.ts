import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Document } from '@langchain/core/documents';
import type { IngestDocumentsDto, IngestDocumentsResponseDto } from '../dto/IngestDocumentsDto';
import type { VectorStoreRepository } from '../../domain/ports/VectorStoreRepository';
import { splitIntoParentChildDocuments } from '../chains/parentDocumentRetriever';
import { JiraTicketLoader } from '../../infrastructure/loaders/JiraTicketLoader';
import { WebCrawlerLoader } from '../../infrastructure/loaders/WebCrawlerLoader';
import type { EnvConfig } from '../../shared/config/env';
import { logger } from '../../shared/logger';

/**
 * Ingests documents from fixtures, Jira, URLs, or raw text into the vector store.
 */
export class IngestDocumentsUseCase {
  private parentDocuments: Document[] = [];

  constructor(
    private readonly vectorStore: VectorStoreRepository,
    private readonly config: EnvConfig,
  ) {}

  /**
   * Returns parent documents indexed during ingestion (for parent-document retrieval).
   */
  getParentDocuments(): Document[] {
    return this.parentDocuments;
  }

  async execute(dto: IngestDocumentsDto): Promise<IngestDocumentsResponseDto> {
    let documents: Document[] = [];

    switch (dto.source) {
      case 'jira': {
        if (!dto.jiraKey) throw new Error('jiraKey is required for jira source');
        documents = await new JiraTicketLoader(this.config, dto.jiraKey).load();
        break;
      }
      case 'url': {
        if (!dto.url) throw new Error('url is required for url source');
        documents = await new WebCrawlerLoader(dto.url).load();
        break;
      }
      case 'text': {
        if (!dto.text) throw new Error('text is required for text source');
        documents = [
          {
            pageContent: dto.text,
            metadata: { source: 'text', type: 'parent', parentId: `text-${Date.now()}` },
          } as Document,
        ];
        break;
      }
      case 'fixture':
      default: {
        const fixturePath =
          dto.fixturePath ??
          path.join(process.cwd(), 'fixtures', 'sample-prs', 'example-pr-1.md');
        const content = await readFile(fixturePath, 'utf-8');
        documents = [
          {
            pageContent: content,
            metadata: { source: 'fixture', type: 'parent', parentId: path.basename(fixturePath) },
          } as Document,
        ];
        break;
      }
    }

    const { parents, children } = await splitIntoParentChildDocuments(documents);
    this.parentDocuments.push(...parents);
    await this.vectorStore.addDocuments(children);

    const total = await this.vectorStore.count();
    logger.info('Documents ingested', { added: children.length, total });

    return { documentsAdded: children.length, totalDocuments: total };
  }
}
