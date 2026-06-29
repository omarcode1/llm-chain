import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from '@langchain/classic/chains';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

const legacyTemplate = `Summarize this pull request context into a short description.

Jira:
{jira}

Diff:
{diff}

Summary:`;

/**
 * Legacy LLMChain for PR summarization (educational comparison with LCEL).
 */
export function buildLegacySummarizeChain(llm: BaseChatModel): LLMChain {
  const prompt = PromptTemplate.fromTemplate(legacyTemplate);
  return new LLMChain({ llm, prompt });
}
