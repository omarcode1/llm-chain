import { v4 as uuidv4 } from 'uuid';
import { PRDraft } from '../../domain/entities/PRDraft';
import type { LLMProvider } from '../../domain/ports/LLMProvider';
import type { VectorStoreRepository } from '../../domain/ports/VectorStoreRepository';
import type { GeneratePRDto, GeneratePRResponseDto } from '../dto/GeneratePRDto';
import { buildPRGenerationChain } from '../chains/prGenerationChain';
import { splitIntoParentChildDocuments } from '../chains/parentDocumentRetriever';
import { JiraTicketLoader } from '../../infrastructure/loaders/JiraTicketLoader';
import { GitDiffLoader } from '../../infrastructure/loaders/GitDiffLoader';
import type { EnvConfig } from '../../shared/config/env';
import { ConversationMemoryStore } from '../../infrastructure/memory/ConversationMemory';
import { logger } from '../../shared/logger';

/**
 * Generates a structured PR description from Jira context, git diff, and RAG retrieval.
 */
export class GeneratePRDescriptionUseCase {
  constructor(
    private readonly llmProvider: LLMProvider,
    private readonly vectorStore: VectorStoreRepository,
    private readonly config: EnvConfig,
    private readonly memoryStore: ConversationMemoryStore,
  ) {}

  async execute(dto: GeneratePRDto): Promise<GeneratePRResponseDto> {
    const repoPath = dto.repoPath ?? this.config.defaultRepoPath;
    const sessionId = uuidv4();

    const jiraDocs = await new JiraTicketLoader(this.config, dto.jiraKey).load();
    const diffDocs = await new GitDiffLoader({
      repoPath,
      branch: dto.branch,
      diffPath: dto.diffPath,
    }).load();

    const jiraContent = jiraDocs[0]?.pageContent ?? '';
    const diffContent = diffDocs[0]?.pageContent ?? '(empty diff)';

    const { parents, children } = await splitIntoParentChildDocuments([
      ...jiraDocs,
      ...diffDocs,
    ]);

    const llm = this.llmProvider.getModel({ repoPath, temperature: 0.2 });
    const chain = buildPRGenerationChain(llm, this.vectorStore, { parents, children });

    const query = `${dto.jiraKey} ${jiraContent.slice(0, 200)}`;
    logger.info('Generating PR description', { jiraKey: dto.jiraKey, sessionId });

    const result = await chain.invoke({
      jiraContent,
      diffContent,
      jiraKey: dto.jiraKey,
      query,
      modelName: this.llmProvider.getProviderName(),
      parentChildDocs: { parents, children },
    });

    const draft = PRDraft.create({
      title: result.title,
      summary: result.summary,
      changes: result.changes,
      testPlan: result.testPlan,
      risks: result.risks,
      jiraKey: result.jiraKey ?? dto.jiraKey,
      metadata: {
        noSimilarPRsFound: result.metadata?.noSimilarPRsFound ?? false,
        model: this.llmProvider.getProviderName(),
        sessionId,
      },
    });

    this.memoryStore.createSession(sessionId, draft.toJSON());

    return {
      sessionId,
      draft: draft.toJSON(),
    };
  }
}
