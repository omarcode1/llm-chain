/**
 * Example 09: Memory & Chat History
 * Run: npm run example:memory
 */
import 'dotenv/config';
import { BufferWindowMemory } from '../src/infrastructure/memory/ConversationMemory';

async function main(): Promise<void> {
  const memory = new BufferWindowMemory(4);

  memory.addUserMessage('Generate a PR for PROJ-123 auth middleware.');
  memory.addAIMessage('Draft: Adds JWT auth middleware to protected routes.');
  memory.addUserMessage('Make the summary shorter.');
  memory.addAIMessage('Draft updated with shorter summary.');
  memory.addUserMessage('Add rollback plan to risks.');

  console.log('--- Chat History ---');
  for (const msg of memory.getHistory()) {
    console.log(`${msg.role}: ${msg.content}`);
  }

  console.log('\n--- Window (last 4 messages) ---');
  console.log(memory.getMessagesAsString());
}

main().catch(console.error);
