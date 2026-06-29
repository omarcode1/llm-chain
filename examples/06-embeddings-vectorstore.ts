/**
 * Example 06: Embeddings & VectorStores
 * Run: npm run example:embeddings
 */
import 'dotenv/config';
import { Document } from '@langchain/core/documents';
import { loadEnv } from '../src/shared/config/env';
import { createEmbeddings } from '../src/infrastructure/embeddings/createEmbeddings';
import { createVectorStoreRepository } from '../src/infrastructure/vectorstores/PineconeVectorStoreAdapter';

async function main(): Promise<void> {
  const config = loadEnv();
  const embeddings = createEmbeddings(config);
  const vectorStore = await createVectorStoreRepository(config, embeddings);

  const docs = [
    new Document({
      pageContent: 'PR adding JWT authentication middleware to Express routes.',
      metadata: { source: 'pr-1', type: 'parent', parentId: 'pr-1' },
    }),
    new Document({
      pageContent: 'PR fixing pagination off-by-one in task list endpoint.',
      metadata: { source: 'pr-2', type: 'parent', parentId: 'pr-2' },
    }),
  ];

  await vectorStore.addDocuments(docs);
  console.log('--- Indexed documents:', await vectorStore.count());

  const results = await vectorStore.similaritySearch('authentication middleware', 2);
  console.log('\n--- Similarity search: "authentication middleware" ---');
  for (const doc of results) {
    console.log('-', doc.pageContent.slice(0, 80), '...');
  }
}

main().catch(console.error);
