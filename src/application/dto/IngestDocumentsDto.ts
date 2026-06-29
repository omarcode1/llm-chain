/**
 * Input for ingesting documents into the vector store.
 */
export interface IngestDocumentsDto {
  source: 'fixture' | 'jira' | 'url' | 'text';
  jiraKey?: string;
  url?: string;
  text?: string;
  fixturePath?: string;
}

/**
 * Result of a document ingestion operation.
 */
export interface IngestDocumentsResponseDto {
  documentsAdded: number;
  totalDocuments: number;
}
