/**
 * Input for generating a PR description from Jira and code changes.
 */
export interface GeneratePRDto {
  jiraKey: string;
  diffPath?: string;
  branch?: string;
  repoPath?: string;
}

/**
 * API response shape for a generated PR draft.
 */
export interface GeneratePRResponseDto {
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
}
