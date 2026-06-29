# LLM Chain — PR Description Agent

RAG-based agent that generates pull request descriptions from **Jira tickets** and **git diffs**, built with **LangChain.js**, **Cursor SDK**, and **Clean Architecture**.

## Problem & ROI

Engineers spend 15–30 minutes writing PR descriptions. This agent drafts structured PR text (title, summary, changes, test plan, risks) in seconds using Jira context, code diffs, and similar past PRs from a vector store.

## Prerequisites

- **Node.js** 18+
- **npm**
- **Cursor API key** (`CURSOR_API_KEY`)
- **Jira Cloud API token** (`JIRA_*` env vars)
- Optional: AWS Bedrock, Pinecone, LangSmith credentials

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
```

## Run

```bash
# Development server (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

Server: **http://localhost:3000**

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/api/v1/documents/ingest` | Ingest docs into vector store |
| `POST` | `/api/v1/pr/generate` | Generate PR from Jira + diff |
| `POST` | `/api/v1/pr/refine` | Refine draft via chat |
| `GET` | `/api/v1/pr/sessions/:id` | Get session history |

### Examples

```bash
# Ingest sample PR fixtures (auto-run on startup too)
curl -X POST http://localhost:3000/api/v1/documents/ingest \
  -H "Content-Type: application/json" \
  -d '{"source":"fixture"}'

# Generate PR description
curl -X POST http://localhost:3000/api/v1/pr/generate \
  -H "Content-Type: application/json" \
  -d '{
    "jiraKey": "PROJ-123",
    "diffPath": "fixtures/sample-diff.patch",
    "repoPath": "."
  }'

# Refine the draft
curl -X POST http://localhost:3000/api/v1/pr/refine \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "<session-id-from-generate>",
    "message": "Make the summary shorter and add rollback steps to risks"
  }'
```

## Course Topic Index

| Topic | Example script | Production code |
|-------|----------------|-----------------|
| Prompts & PromptTemplates | `npm run example:prompts` | `src/application/chains/prGenerationChain.ts` |
| Output Parsers | `npm run example:parsers` | `src/application/schemas/prDraftSchema.ts` |
| Legacy chains | `npm run example:legacy` | `src/application/chains/legacySummarizeChain.ts` |
| LCEL | `npm run example:lcel` | `src/application/chains/prGenerationChain.ts` |
| LLM parameters | `npm run example:params` | `src/infrastructure/llm/createLLM.ts` |
| Embeddings & VectorStores | `npm run example:embeddings` | `src/infrastructure/vectorstores/` |
| RAG | `npm run example:rag` | `src/application/use-cases/GeneratePRDescription.ts` |
| Tools / loaders / splitters | `npm run example:tools` | `src/infrastructure/loaders/` |
| Memory & chat history | `npm run example:memory` | `src/infrastructure/memory/ConversationMemory.ts` |

## Architecture

See **[docs/architecture.md](docs/architecture.md)** for Mermaid diagrams: system overview, Clean Architecture layers, ingest/generate/refine flows, parent-document retrieval, and provider wiring.

```
src/
  domain/         # Entities, ports, domain errors
  application/    # Use cases, DTOs, LCEL chains
  infrastructure/ # Express, LLM adapters, loaders, vector stores
  shared/         # Config, logger
```

**Generate flow:** Jira + git diff → RAG retrieval (parent docs) → LCEL prompt → LLM → Zod parser → `PRDraft` JSON + session.

**Ingest flow:** Loaders → text splitter → embeddings → vector store (child chunks; parents kept for retrieval).

## Provider Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `cursor` | `cursor` or `bedrock` |
| `PINECONE_API_KEY` | — | Enables Pinecone (else in-memory) |
| `LANGCHAIN_TRACING_V2` | `false` | Enable LangSmith tracing |

## LangSmith Evaluation

1. Set `LANGCHAIN_TRACING_V2=true` and `LANGCHAIN_API_KEY` in `.env`
2. Run PR generation and refinement flows
3. Capture before/after traces when iterating prompts
4. See `docs/TDD-outline.md` for evaluation evidence template

## Documentation

- [TDD Outline](docs/TDD-outline.md) — Technical Design Document skeleton for Moodle submission
