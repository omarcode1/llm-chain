/**
 * Example 01: Prompts & PromptTemplates
 * Run: npm run example:prompts
 */
import 'dotenv/config';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';

async function main(): Promise<void> {
  const simple = PromptTemplate.fromTemplate(
    'Write a one-line PR title for Jira ticket {jiraKey}: {summary}',
  );
  console.log('--- PromptTemplate ---');
  console.log(await simple.format({ jiraKey: 'PROJ-123', summary: 'Add auth middleware' }));

  const chat = ChatPromptTemplate.fromMessages([
    ['system', 'You are a senior engineer writing PR descriptions.'],
    ['human', 'Ticket: {jiraKey}\nSummary: {summary}\nDiff snippet:\n{diff}'],
  ]);
  console.log('\n--- ChatPromptTemplate ---');
  const messages = await chat.formatMessages({
    jiraKey: 'PROJ-123',
    summary: 'Add JWT auth',
    diff: '+ export function authMiddleware() { ... }',
  });
  console.log(messages.map((m) => `${m._getType()}: ${m.content}`).join('\n'));
}

main().catch(console.error);
