import { z } from 'zod';

/** LLM may return prose or bullet list; domain/API always use a single string. */
const stringOrStringArray = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    Array.isArray(value) ? value.map((step) => `- ${step}`).join('\n') : value,
  );

/**
 * Zod schema for structured PR description output from the LLM.
 */
export const prDraftSchema = z.object({
  title: z.string().describe('Concise PR title linking to the Jira ticket'),
  summary: z.string().describe('2-4 sentence overview of what this PR accomplishes'),
  changes: z.array(z.string()).describe('Bullet list of key code/config changes'),
  testPlan: stringOrStringArray.describe(
    'Steps to verify the change works (string or bullet list)',
  ),
  risks: z.array(z.string()).describe('Potential risks, rollback notes, or edge cases'),
  jiraKey: z.string().describe('The Jira ticket key this PR addresses'),
  metadata: z
    .object({
      noSimilarPRsFound: z.boolean().optional(),
      model: z.string(),
    })
    .optional(),
});

export type PRDraftSchema = z.infer<typeof prDraftSchema>;
