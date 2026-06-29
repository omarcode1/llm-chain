/**
 * Example 08: Tools — Document Loaders, Text Splitters, Web Crawler
 * Run: npm run example:tools
 */
import 'dotenv/config';
import path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GitDiffLoader } from '../src/infrastructure/loaders/GitDiffLoader';
import { splitIntoParentChildDocuments } from '../src/application/chains/parentDocumentRetriever';

async function main(): Promise<void> {
  const diffPath = path.join(process.cwd(), 'fixtures', 'sample-diff.patch');
  const gitLoader = new GitDiffLoader({ repoPath: process.cwd(), diffPath });
  const diffDocs = await gitLoader.load();
  console.log('--- GitDiffLoader ---');
  console.log(diffDocs[0]?.pageContent.slice(0, 200), '...');

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 20 });
  const chunks = await splitter.splitDocuments(diffDocs);
  console.log('\n--- RecursiveCharacterTextSplitter ---');
  console.log('Chunks:', chunks.length);

  const { parents, children } = await splitIntoParentChildDocuments(diffDocs, 100, 20);
  console.log('\n--- Parent-Child split ---');
  console.log('Parents:', parents.length, 'Children:', children.length);
  console.log('Child metadata sample:', children[0]?.metadata);
}

main().catch(console.error);
