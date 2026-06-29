import type { Document } from '@langchain/core/documents';

/**
 * Port for document storage and similarity search (vector store abstraction).
 */
export interface VectorStoreRepository {
  /**
   * Adds documents to the vector index.
   */
  addDocuments(documents: Document[]): Promise<void>;

  /**
   * Returns the top-k most similar documents for a query string.
   */
  similaritySearch(query: string, k?: number): Promise<Document[]>;

  /**
   * Returns the number of indexed documents.
   */
  count(): Promise<number>;
}
