import type { PRDraftProps } from '../../domain/entities/PRDraft';

interface ChatMessage {
  role: 'human' | 'ai';
  content: string;
}

/**
 * Sliding-window conversation memory for PR refinement sessions.
 */
export class BufferWindowMemory {
  private readonly messages: ChatMessage[] = [];
  private readonly k: number;

  constructor(windowSize = 10) {
    this.k = windowSize;
  }

  addUserMessage(content: string): void {
    this.messages.push({ role: 'human', content });
    this.trim();
  }

  addAIMessage(content: string): void {
    this.messages.push({ role: 'ai', content });
    this.trim();
  }

  getHistory(): ChatMessage[] {
    return [...this.messages];
  }

  getMessagesAsString(): string {
    return this.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  }

  private trim(): void {
    while (this.messages.length > this.k) {
      this.messages.shift();
    }
  }
}

export interface PRSession {
  draft: PRDraftProps;
  memory: BufferWindowMemory;
  createdAt: Date;
}

/**
 * In-memory store for active PR refinement sessions.
 */
export class ConversationMemoryStore {
  private readonly sessions = new Map<string, PRSession>();

  createSession(sessionId: string, draft: PRDraftProps): PRSession {
    const session: PRSession = {
      draft,
      memory: new BufferWindowMemory(10),
      createdAt: new Date(),
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): PRSession | undefined {
    return this.sessions.get(sessionId);
  }
}
