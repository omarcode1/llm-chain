import { FakeEmbeddings } from '@langchain/core/utils/testing';
import { BedrockEmbeddings } from '@langchain/aws';
import type { Embeddings } from '@langchain/core/embeddings';
import type { EnvConfig } from '../../shared/config/env';

/**
 * Creates embedding model based on available credentials.
 * Uses Bedrock Titan when configured, otherwise FakeEmbeddings for local dev.
 */
export function createEmbeddings(config: EnvConfig): Embeddings {
  if (config.bedrockAccessKeyId && config.bedrockSecretAccessKey) {
    return new BedrockEmbeddings({
      region: config.bedrockRegion,
      credentials: {
        accessKeyId: config.bedrockAccessKeyId,
        secretAccessKey: config.bedrockSecretAccessKey,
      },
      model: config.bedrockEmbeddingModel,
    });
  }
  return new FakeEmbeddings();
}
