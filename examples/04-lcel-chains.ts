/**
 * Example 04: LCEL Chains (RunnableSequence)
 * Run: npm run example:lcel
 */
import 'dotenv/config';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { FakeListChatModel } from '@langchain/core/utils/testing';

async function main(): Promise<void> {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'Summarize PR changes in one sentence.'],
    ['human', 'Jira: {jira}\nDiff: {diff}'],
  ]);

  const llm = new FakeListChatModel({
    responses: ['LCEL chain: adds auth middleware to protect task routes.'],
  });

  const chain = RunnableSequence.from([prompt, llm, new StringOutputParser()]);

  console.log('--- LCEL RunnableSequence ---');
  const result = await chain.invoke({
    jira: 'PROJ-123',
    diff: '+ authMiddleware',
  });
  console.log(result);

  console.log('\n--- Streaming ---');
  const stream = await chain.stream({ jira: 'PROJ-123', diff: '+ authMiddleware' });
  for await (const chunk of stream) {
    process.stdout.write(String(chunk));
  }
  console.log();
}

main().catch(console.error);
