/**
 * Example 05: LLM Parameters (temperature, top-p, top-k)
 * Run: npm run example:params
 */
import 'dotenv/config';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { FakeListChatModel } from '@langchain/core/utils/testing';
import { loadEnv } from '../src/shared/config/env';
import { createLLMProvider } from '../src/infrastructure/llm/createLLM';

async function runWithFake(temperature: number): Promise<void> {
  const llm = new FakeListChatModel({
    responses: [`Response at temperature ${temperature}: deterministic vs creative output.`],
  });
  const prompt = ChatPromptTemplate.fromTemplate('Describe this change: {change}');
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  const result = await chain.invoke({ change: 'add auth middleware' });
  console.log(`temp=${temperature}:`, result);
}

async function main(): Promise<void> {
  console.log('--- Fake LLM: temperature comparison ---');
  await runWithFake(0);
  await runWithFake(0.7);

  const config = loadEnv();
  console.log('\n--- Provider config ---');
  console.log('LLM_PROVIDER:', config.llmProvider);
  console.log('Bedrock topP/topK available when LLM_PROVIDER=bedrock');

  if (config.llmProvider === 'bedrock' && config.bedrockAccessKeyId) {
    const provider = createLLMProvider(config);
    const precise = provider.getModel({ temperature: 0, topP: 0.9, topK: 40 });
    console.log('Bedrock model created with topP=0.9, topK=40:', precise._llmType());
  } else {
    console.log('Set LLM_PROVIDER=bedrock and Bedrock credentials to test topP/topK live.');
  }
}

main().catch(console.error);
