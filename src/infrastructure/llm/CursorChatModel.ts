import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { ChatResult } from '@langchain/core/outputs';
import { BaseChatModel, BaseChatModelParams } from '@langchain/core/language_models/chat_models';
import { Agent } from '@cursor/sdk';
import type { EnvConfig } from '../../shared/config/env';
import { assertCursorConfigured } from '../../shared/config/env';

export interface CursorChatModelFields extends BaseChatModelParams {
  config: EnvConfig;
  temperature?: number;
  repoPath?: string;
}

/**
 * LangChain chat model adapter that delegates inference to the Cursor SDK.
 */
export class CursorChatModel extends BaseChatModel {
  private readonly envConfig: EnvConfig;
  private readonly temperature: number;
  private readonly repoPath: string;

  constructor(fields: CursorChatModelFields) {
    super(fields);
    this.envConfig = fields.config;
    this.temperature = fields.temperature ?? 0.2;
    this.repoPath = fields.repoPath ?? fields.config.defaultRepoPath;
  }

  _llmType(): string {
    return 'cursor';
  }

  /**
   * Converts LangChain messages into a single prompt string for Cursor Agent.
   */
  private messagesToPrompt(messages: BaseMessage[]): string {
    return messages
      .map((m) => {
        const type = m._getType();
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        if (type === 'system') return `System: ${content}`;
        if (type === 'human') return `Human: ${content}`;
        if (type === 'ai') return `Assistant: ${content}`;
        return content;
      })
      .join('\n\n');
  }

  async _generate(
    messages: BaseMessage[],
    _options: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    assertCursorConfigured(this.envConfig);
    const prompt = this.messagesToPrompt(messages);
    const tempHint =
      this.temperature <= 0.1
        ? 'Be precise and deterministic.'
        : this.temperature >= 0.7
          ? 'Be creative but stay factual.'
          : 'Balance precision and clarity.';

    const result = await Agent.prompt(`${tempHint}\n\n${prompt}`, {
      apiKey: this.envConfig.cursorApiKey,
      model: { id: this.envConfig.cursorModel },
      local: { cwd: this.repoPath },
    });

    const text = result.result ?? '';
    return {
      generations: [{ text, message: new AIMessage(text) }],
    };
  }
}
