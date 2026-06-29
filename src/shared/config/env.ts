import { config } from 'dotenv';

config();

export type LLMProviderType = 'cursor' | 'bedrock';
export type VectorStoreType = 'memory' | 'pinecone';

/**
 * Application environment configuration loaded from process.env.
 */
export interface EnvConfig {
  port: number;
  cursorApiKey: string;
  cursorModel: string;
  jiraBaseUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
  llmProvider: LLMProviderType;
  bedrockRegion: string;
  bedrockAccessKeyId: string;
  bedrockSecretAccessKey: string;
  bedrockModel: string;
  bedrockEmbeddingModel: string;
  pineconeApiKey: string;
  pineconeIndex: string;
  langchainTracing: boolean;
  langchainApiKey: string;
  langchainProject: string;
  defaultRepoPath: string;
  vectorStoreType: VectorStoreType;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

/**
 * Loads and validates environment configuration.
 * Soft-requires Cursor/Jira only when those features are invoked at runtime.
 */
export function loadEnv(): EnvConfig {
  const pineconeApiKey = optionalEnv('PINECONE_API_KEY');
  const vectorStoreType: VectorStoreType =
    pineconeApiKey && optionalEnv('PINECONE_INDEX') ? 'pinecone' : 'memory';

  return {
    port: Number(process.env.PORT) || 3000,
    cursorApiKey: optionalEnv('CURSOR_API_KEY'),
    cursorModel: optionalEnv('CURSOR_MODEL', 'composer-2.5'),
    jiraBaseUrl: optionalEnv('JIRA_BASE_URL'),
    jiraEmail: optionalEnv('JIRA_EMAIL'),
    jiraApiToken: optionalEnv('JIRA_API_TOKEN'),
    llmProvider: (optionalEnv('LLM_PROVIDER', 'cursor') as LLMProviderType),
    bedrockRegion: optionalEnv('BEDROCK_AWS_REGION', 'us-east-1'),
    bedrockAccessKeyId: optionalEnv('BEDROCK_AWS_ACCESS_KEY_ID'),
    bedrockSecretAccessKey: optionalEnv('BEDROCK_AWS_SECRET_ACCESS_KEY'),
    bedrockModel: optionalEnv(
      'BEDROCK_MODEL',
      'anthropic.claude-3-5-sonnet-20240620-v1:0',
    ),
    bedrockEmbeddingModel: optionalEnv('BEDROCK_EMBEDDING_MODEL', 'amazon.titan-embed-text-v1'),
    pineconeApiKey,
    pineconeIndex: optionalEnv('PINECONE_INDEX'),
    langchainTracing: optionalEnv('LANGCHAIN_TRACING_V2', 'false') === 'true',
    langchainApiKey: optionalEnv('LANGCHAIN_API_KEY'),
    langchainProject: optionalEnv('LANGCHAIN_PROJECT', 'llmchain-pr-agent'),
    defaultRepoPath: optionalEnv('DEFAULT_REPO_PATH', '.'),
    vectorStoreType,
  };
}

/**
 * Validates that Cursor credentials are present before LLM calls.
 */
export function assertCursorConfigured(config: EnvConfig): void {
  requireEnv('CURSOR_API_KEY', config.cursorApiKey);
}

/**
 * Validates that Jira credentials are present before ticket loading.
 */
export function assertJiraConfigured(config: EnvConfig): void {
  if (!config.jiraBaseUrl || !config.jiraEmail || !config.jiraApiToken) {
    throw new Error('Jira credentials are not configured (JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN)');
  }
}

/**
 * Validates that Bedrock credentials are present.
 */
export function assertBedrockConfigured(config: EnvConfig): void {
  if (!config.bedrockAccessKeyId || !config.bedrockSecretAccessKey) {
    throw new Error('Bedrock credentials are not configured');
  }
}

/**
 * Validates that Pinecone credentials are present.
 */
export function assertPineconeConfigured(config: EnvConfig): void {
  if (!config.pineconeApiKey || !config.pineconeIndex) {
    throw new Error('Pinecone credentials are not configured');
  }
}
