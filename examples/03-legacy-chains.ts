/**
 * Example 03: Legacy Chains (LLMChain)
 * Run: npm run example:legacy
 */
import 'dotenv/config';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { buildLegacySummarizeChain } from '../src/application/chains/legacySummarizeChain';

async function main(): Promise<void> {
  const llm = new FakeListChatModel({
    responses: [
      'Adds JWT auth middleware and protects PATCH/DELETE task routes.',
    ],
  });

  const chain = buildLegacySummarizeChain(llm);
  console.log('--- Legacy LLMChain ---');
  const result = await chain.invoke({
    jira: 'PROJ-123: Add authentication',
    diff: '+ authMiddleware\n+ protected routes',
  });
  console.log(result);
}

main().catch(console.error);
