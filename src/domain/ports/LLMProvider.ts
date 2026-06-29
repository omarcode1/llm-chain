import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

/**
 * Configuration for LLM invocation parameters.
 */
export interface LLMInvokeConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  repoPath?: string;
}

/**
 * Port for language model access, abstracting Cursor and Bedrock providers.
 */
export interface LLMProvider {
  /**
   * Returns the underlying LangChain chat model instance.
   */
  getModel(config?: LLMInvokeConfig): BaseChatModel;

  /**
   * Human-readable provider name for logging and metadata.
   */
  getProviderName(): string;
}
