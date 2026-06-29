/**
 * Example 07: RAG Pipeline
 * Run: npm run example:rag
 */
import 'dotenv/config';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { loadEnv } from '../src/shared/config/env';
import { createEmbeddings } from '../src/infrastructure/embeddings/createEmbeddings';
import { createVectorStoreRepository } from '../src/infrastructure/vectorstores/PineconeVectorStoreAdapter';

async function main(): Promise<void> {
  const config = loadEnv();
  const embeddings = createEmbeddings(config);
  const vectorStore = await createVectorStoreRepository(config, embeddings);

  await vectorStore.addDocuments([
    new Document({
      pageContent: 'Previous PR: Added JWT auth middleware with Bearer token validation.',
      metadata: { type: 'parent', parentId: 'hist-1' },
    }),
  ]);

  const llm = new FakeListChatModel({
    responses: [
      'Based on context, this PR follows the same auth pattern as the previous JWT middleware PR.',
    ],
  });

  const ragChain = RunnableSequence.from([
    async (input: { question: string }) => {
      const docs = await vectorStore.similaritySearch(input.question, 2);
      return {
        question: input.question,
        context: docs.map((d) => d.pageContent).join('\n') || '(no results)',
      };
    },
    ChatPromptTemplate.fromTemplate(
      'Context:\n{context}\n\nQuestion: {question}\n\nAnswer:',
    ),
    llm,
    new StringOutputParser(),
  ]);

  console.log('--- RAG Pipeline ---');
  console.log(await ragChain.invoke({ question: 'How did we implement auth before?' }));
}

main().catch(console.error);
