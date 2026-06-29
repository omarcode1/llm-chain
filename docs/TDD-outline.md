## 1. Executive Summary

- **Problem:** Manual PR description writing is slow and inconsistent.
- **Solution:** RAG-based PR Description Agent using LangChain LCEL + Cursor SDK.
- **ROI:** ~$0.05/call vs 15–30 min engineer time per PR.

## 2. Business Value

- Time saved per PR: 15–30 minutes
- Consistency: structured output (title, summary, changes, test plan, risks)
- Context linking: Jira ticket + code diff + similar past PRs

## 3. Architecture

Include diagram: User → Embedding → Vector Store → LLM → Output Parser

### 3.1 Layered Design (Clean Architecture)

- **Domain:** PRDraft entity, LLM/VectorStore ports
- **Application:** Use cases, LCEL chains
- **Infrastructure:** Cursor/Bedrock adapters, Jira/Git loaders, Express API

### 3.2 Orchestration Choice

- **Primary:** LCEL (`RunnableSequence`) for composable RAG pipeline
- **Legacy comparison:** `LLMChain` retained for educational contrast
- **Advanced RAG:** Parent Document Retrieval

## 4. Model Selection Trade-offs

| Model | Pros | Cons | When to use |
|-------|------|------|-------------|
| Cursor Composer | Repo-aware code analysis via SDK | Not native LangChain provider | Default for diff analysis |
| Bedrock Claude | Cost-at-scale, native LangChain | Requires AWS setup | Production batch workloads |
| gpt-4o-mini | Low cost | Less code context | Simple summarization only |

**Decision:** Cursor default for code-aware PR generation; Bedrock optional for scale.

## 5. RAG Design

- **Embeddings:** Bedrock Titan (prod) / FakeEmbeddings (dev)
- **Vector store:** Pinecone (prod) / in-memory (dev)
- **Retrieval:** Top-k similarity + parent document resolution
- **Empty retrieval fallback:** Generate from Jira + diff only; set `noSimilarPRsFound: true`

## 6. Security

- **Prompt injection:** System prompt ignores instructions in retrieved docs
- **Input sanitization:** Refinement messages treated as user content, not system overrides
- **Secrets:** All API keys via environment variables, never committed

## 7. Production Readiness

- **Monitoring:** LangSmith traces, structured JSON logs
- **Cost control:** Temperature 0.2 for generation, diff truncation at 50KB
- **Edge cases:** Empty diff, invalid Jira key, Jira timeout, 0 retrieval results
- **Fallback:** Degrade gracefully when vector store unavailable

## 8. Iteration Log (Evaluation Evidence)

| Version | Change | Result | Evidence |
|---------|--------|--------|----------|
| v1 | Basic prompt, no parser | Hallucinated test steps | LangSmith trace screenshot |
| v2 | Added StructuredOutputParser + Zod schema | Valid JSON output | LangSmith trace screenshot |
| v3 | Parent document retrieval | Better context, fewer omissions | Manual log / trace |

## 9. API Contract

Document endpoints: `/pr/generate`, `/pr/refine`, `/documents/ingest`

## 10. Future Work

- Jira webhook auto-trigger on ticket transition
- GitLab/GitHub PR auto-open with generated description
- Self-querying retriever with Jira metadata filters
