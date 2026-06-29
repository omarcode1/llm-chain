/**
 * Input for refining an existing PR draft via chat.
 */
export interface RefinePRDto {
  sessionId: string;
  message: string;
}

/**
 * API response after refining a PR draft.
 */
export interface RefinePRResponseDto {
  sessionId: string;
  draft: {
    title: string;
    summary: string;
    changes: string[];
    testPlan: string;
    risks: string[];
    jiraKey: string;
    metadata: {
      noSimilarPRsFound?: boolean;
      model: string;
      sessionId?: string;
    };
  };
  history: Array<{ role: 'human' | 'ai'; content: string }>;
}
