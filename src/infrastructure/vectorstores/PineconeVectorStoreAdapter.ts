import { Document } from '@langchain/core/documents';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import type { Embeddings } from '@langchain/core/embeddings';
import type { VectorStoreRepository } from '../../domain/ports/VectorStoreRepository';
import type { EnvConfig } from '../../shared/config/env';
import { assertPineconeConfigured } from '../../shared/config/env';
import { InMemoryVectorStoreAdapter } from './InMemoryVectorStoreAdapter';

/**
 * Pinecone vector store adapter implementing the domain repository port.
 */
export class PineconeVectorStoreAdapter implements VectorStoreRepository {
  private constructor(private readonly store: PineconeStore) {}

  /**
   * Connects to an existing Pinecone index.
   */
  static async create(
    config: EnvConfig,
    embeddings: Embeddings,
  ): Promise<PineconeVectorStoreAdapter> {
    assertPineconeConfigured(config);
    const client = new Pinecone({ apiKey: config.pineconeApiKey });
    const index = client.Index(config.pineconeIndex);
    const store = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    return new PineconeVectorStoreAdapter(store);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;
    await this.store.addDocuments(documents);
  }

  async similaritySearch(query: string, k = 4): Promise<Document[]> {
    return this.store.similaritySearch(query, k);
  }

  async count(): Promise<number> {
    return this.store.similaritySearch('', 10000).then((d) => d.length);
  }
}

/**
 * Factory that selects in-memory or Pinecone vector store based on config.
 */
export async function createVectorStoreRepository(
  config: EnvConfig,
  embeddings: Embeddings,
): Promise<VectorStoreRepository> {
  if (config.vectorStoreType === 'pinecone') {
    return PineconeVectorStoreAdapter.create(config, embeddings);
  }
  return InMemoryVectorStoreAdapter.create(embeddings);
}
