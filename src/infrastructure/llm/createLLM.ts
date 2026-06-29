import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { LLMInvokeConfig, LLMProvider } from '../../domain/ports/LLMProvider';
import type { EnvConfig } from '../../shared/config/env';
import { assertBedrockConfigured } from '../../shared/config/env';
import { createBedrockChatModel } from './BedrockChatModel';
import { CursorChatModel } from './CursorChatModel';

/**
 * LLM provider implementation backed by AWS Bedrock Converse API.
 */
export class BedrockLLMProvider implements LLMProvider {
  constructor(private readonly config: EnvConfig) {}

  getProviderName(): string {
    return 'bedrock';
  }

  getModel(options?: LLMInvokeConfig): BaseChatModel {
    assertBedrockConfigured(this.config);
    return createBedrockChatModel(this.config, options);
  }
}

/**
 * LLM provider implementation backed by the Cursor SDK.
 */
export class CursorLLMProvider implements LLMProvider {
  constructor(private readonly config: EnvConfig) {}

  getProviderName(): string {
    return 'cursor';
  }

  getModel(options?: LLMInvokeConfig): BaseChatModel {
    return new CursorChatModel({
      config: this.config,
      temperature: options?.temperature ?? 0.2,
      repoPath: options?.repoPath ?? this.config.defaultRepoPath,
    });
  }
}

/**
 * Factory that selects the configured LLM provider.
 */
export function createLLMProvider(config: EnvConfig): LLMProvider {
  if (config.llmProvider === 'bedrock') {
    return new BedrockLLMProvider(config);
  }
  return new CursorLLMProvider(config);
}
