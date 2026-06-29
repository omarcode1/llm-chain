import { Document } from '@langchain/core/documents';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import type { Embeddings } from '@langchain/core/embeddings';
import type { VectorStoreRepository } from '../../domain/ports/VectorStoreRepository';

/**
 * In-memory vector store adapter implementing the domain repository port.
 */
export class InMemoryVectorStoreAdapter implements VectorStoreRepository {
  private store: MemoryVectorStore;

  private constructor(store: MemoryVectorStore) {
    this.store = store;
  }

  /**
   * Creates an empty in-memory vector store.
   */
  static async create(embeddings: Embeddings): Promise<InMemoryVectorStoreAdapter> {
    const store = new MemoryVectorStore(embeddings);
    return new InMemoryVectorStoreAdapter(store);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;
    await this.store.addDocuments(documents);
  }

  async similaritySearch(query: string, k = 4): Promise<Document[]> {
    return this.store.similaritySearch(query, k);
  }

  async count(): Promise<number> {
    const docs = await this.store.similaritySearch('', 10000);
    return docs.length;
  }
}
