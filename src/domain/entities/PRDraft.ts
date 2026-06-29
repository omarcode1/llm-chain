/**
 * Metadata attached to a generated PR draft.
 */
export interface PRDraftMetadata {
  noSimilarPRsFound?: boolean;
  model: string;
  sessionId?: string;
}

/**
 * Structured PR description produced by the generation chain.
 */
export interface PRDraftProps {
  title: string;
  summary: string;
  changes: string[];
  testPlan: string;
  risks: string[];
  jiraKey: string;
  metadata: PRDraftMetadata;
}

/**
 * Domain entity representing a generated pull request description.
 */
export class PRDraft {
  private constructor(private readonly props: PRDraftProps) {}

  /**
   * Creates a validated PR draft from raw properties.
   */
  static create(props: PRDraftProps): PRDraft {
    if (!props.title.trim()) {
      throw new Error('PR title is required');
    }
    if (!props.jiraKey.trim()) {
      throw new Error('Jira key is required');
    }
    return new PRDraft(props);
  }

  get title(): string {
    return this.props.title;
  }

  get summary(): string {
    return this.props.summary;
  }

  get changes(): readonly string[] {
    return this.props.changes;
  }

  get testPlan(): string {
    return this.props.testPlan;
  }

  get risks(): readonly string[] {
    return this.props.risks;
  }

  get jiraKey(): string {
    return this.props.jiraKey;
  }

  get metadata(): PRDraftMetadata {
    return this.props.metadata;
  }

  /**
   * Serializes the draft to a plain object for API responses.
   */
  toJSON(): PRDraftProps {
    return { ...this.props, changes: [...this.props.changes], risks: [...this.props.risks] };
  }
}
