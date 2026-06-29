import { PRDraft } from '../../domain/entities/PRDraft';
import { SessionNotFoundError } from '../../domain/errors/SessionNotFoundError';
import type { LLMProvider } from '../../domain/ports/LLMProvider';
import type { RefinePRDto, RefinePRResponseDto } from '../dto/RefinePRDto';
import { buildRefineChain } from '../chains/refineChain';
import { ConversationMemoryStore } from '../../infrastructure/memory/ConversationMemory';
import { logger } from '../../shared/logger';

/**
 * Refines an existing PR draft using conversational memory and user feedback.
 */
export class RefinePRDescriptionUseCase {
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly memoryStore: ConversationMemoryStore,
  ) {}

  async execute(dto: RefinePRDto): Promise<RefinePRResponseDto> {
    const session = this.memoryStore.getSession(dto.sessionId);
    if (!session) {
      throw new SessionNotFoundError(dto.sessionId);
    }

    const chatHistory = session.memory.getMessagesAsString();
    const llm = this.llmProvider.getModel({ temperature: 0.3 });
    const chain = buildRefineChain(llm);

    logger.info('Refining PR description', { sessionId: dto.sessionId });

    const result = await chain.invoke({
      currentDraft: session.draft,
      userMessage: dto.message,
      chatHistory,
    });

    const draft = PRDraft.create({
      title: result.title,
      summary: result.summary,
      changes: result.changes,
      testPlan: result.testPlan,
      risks: result.risks,
      jiraKey: result.jiraKey,
      metadata: {
        ...session.draft.metadata,
        ...result.metadata,
        sessionId: dto.sessionId,
      },
    });

    session.memory.addUserMessage(dto.message);
    session.memory.addAIMessage(JSON.stringify(draft.toJSON()));
    session.draft = draft.toJSON();

    return {
      sessionId: dto.sessionId,
      draft: draft.toJSON(),
      history: session.memory.getHistory(),
    };
  }
}

/**
 * Retrieves session chat history and current draft.
 */
export class GetPRSessionUseCase {
  constructor(private readonly memoryStore: ConversationMemoryStore) {}

  execute(sessionId: string): RefinePRResponseDto {
    const session = this.memoryStore.getSession(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    return {
      sessionId,
      draft: session.draft,
      history: session.memory.getHistory(),
    };
  }
}
