import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatBedrockConverse } from '@langchain/aws';
import type { LLMInvokeConfig } from '../../domain/ports/LLMProvider';
import type { EnvConfig } from '../../shared/config/env';

/**
 * Creates a configured AWS Bedrock Converse chat model instance.
 */
export function createBedrockChatModel(
  config: EnvConfig,
  options?: LLMInvokeConfig,
): BaseChatModel {
  return new ChatBedrockConverse({
    model: config.bedrockModel,
    region: config.bedrockRegion,
    credentials: {
      accessKeyId: config.bedrockAccessKeyId,
      secretAccessKey: config.bedrockSecretAccessKey,
    },
    temperature: options?.temperature ?? 0.2,
    topP: options?.topP,
    maxTokens: options?.maxTokens ?? 4096,
  });
}
