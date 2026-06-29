import type { Document } from '@langchain/core/documents';

/**
 * Port for loading external documents into LangChain Document format.
 */
export interface DocumentLoaderPort {
  /**
   * Loads documents from the configured source.
   */
  load(): Promise<Document[]>;
}
