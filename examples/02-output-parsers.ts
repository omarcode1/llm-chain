/**
 * Example 02: Output Parsers
 * Run: npm run example:parsers
 */
import 'dotenv/config';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { OutputFixingParser } from '@langchain/classic/output_parsers';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { prDraftSchema } from '../src/application/schemas/prDraftSchema';

async function main(): Promise<void> {
  const parser = StructuredOutputParser.fromZodSchema(prDraftSchema);
  console.log('--- Format Instructions ---');
  console.log(parser.getFormatInstructions());

  const validJson = JSON.stringify({
    title: 'Add auth middleware',
    summary: 'Implements JWT validation for protected routes.',
    changes: ['Added authMiddleware', 'Updated routes'],
    testPlan: 'Verify 401 without token',
    risks: ['Clients must send Authorization header'],
    jiraKey: 'PROJ-123',
  });

  console.log('\n--- StructuredOutputParser ---');
  console.log(await parser.parse(validJson));

  const brokenJson = '{ title: "missing quotes", summary: broken }';
  const fixingParser = OutputFixingParser.fromLLM(
    new FakeListChatModel({ responses: [validJson] }),
    parser,
  );

  console.log('\n--- OutputFixingParser (simulated fix) ---');
  console.log(await fixingParser.parse(brokenJson));
}

main().catch(console.error);
