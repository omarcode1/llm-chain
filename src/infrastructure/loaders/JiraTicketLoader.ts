import { Document } from '@langchain/core/documents';
import { JiraTicketNotFoundError } from '../../domain/errors/JiraTicketNotFoundError';
import type { EnvConfig } from '../../shared/config/env';
import { assertJiraConfigured } from '../../shared/config/env';

interface JiraIssueResponse {
  key: string;
  fields: {
    summary?: string;
    description?: unknown;
    labels?: string[];
    issuetype?: { name?: string };
    project?: { key?: string };
    customfield_10014?: string;
  };
}

/**
 * Loads Jira tickets via REST API v3 and converts them to LangChain Documents.
 */
export class JiraTicketLoader {
  constructor(
    private readonly config: EnvConfig,
    private readonly jiraKey: string,
  ) {}

  /**
   * Fetches the Jira issue and returns a parent document with metadata.
   */
  async load(): Promise<Document[]> {
    assertJiraConfigured(this.config);
    const url = `${this.config.jiraBaseUrl.replace(/\/$/, '')}/rest/api/3/issue/${this.jiraKey}`;
    const auth = Buffer.from(`${this.config.jiraEmail}:${this.config.jiraApiToken}`).toString(
      'base64',
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      throw new JiraTicketNotFoundError(this.jiraKey);
    }

    if (!response.ok) {
      throw new JiraTicketNotFoundError(this.jiraKey, {
        cause: new Error(`Jira API error: ${response.status} ${response.statusText}`),
      });
    }

    const issue = (await response.json()) as JiraIssueResponse;
    const description = this.extractDescription(issue.fields.description);
    const summary = issue.fields.summary ?? '';
    const labels = issue.fields.labels?.join(', ') ?? '';
    const project = issue.fields.project?.key ?? '';
    const issueType = issue.fields.issuetype?.name ?? '';

    const pageContent = [
      `Jira Key: ${issue.key}`,
      `Summary: ${summary}`,
      `Type: ${issueType}`,
      `Labels: ${labels}`,
      '',
      'Description:',
      description,
    ].join('\n');

    return [
      new Document({
        pageContent,
        metadata: {
          source: 'jira',
          key: issue.key,
          project,
          type: 'parent',
          parentId: issue.key,
        },
      }),
    ];
  }

  /**
   * Recursively extracts plain text from Jira ADF description nodes.
   */
  private extractDescription(description: unknown): string {
    if (!description) return '';
    if (typeof description === 'string') return description;
    if (typeof description !== 'object' || description === null) return String(description);

    const node = description as { type?: string; text?: string; content?: unknown[] };
    if (node.type === 'text' && node.text) return node.text;
    if (Array.isArray(node.content)) {
      return node.content.map((c) => this.extractDescription(c)).join('\n');
    }
    return '';
  }
}
