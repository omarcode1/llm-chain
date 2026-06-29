# Architecture

Mermaid diagrams for the **LLM Chain PR Description Agent**. Render in GitHub, GitLab, VS Code (Mermaid preview), or [mermaid.live](https://mermaid.live).

## System overview

```mermaid
flowchart LR
  subgraph Client
    Eng[Engineer / API client]
  end

  subgraph App["llmchain-pr-agent (Node + Express)"]
    API[HTTP API]
    UC[Use cases]
    Chains[LCEL chains]
    API --> UC --> Chains
  end

  subgraph External["External services"]
    Jira[Jira Cloud API]
    Git[Local git repo]
    LLM["LLM — Cursor SDK / AWS Bedrock"]
    VS["Vector store — In-memory / Pinecone"]
    LS[LangSmith optional]
  end

  Eng -->|REST| API
  UC --> Jira
  UC --> Git
  Chains --> LLM
  UC --> VS
  Chains -.->|tracing| LS
```

## Clean Architecture layers

Dependency direction: **infrastructure → application → domain**. Domain has no outward imports.

```mermaid
flowchart TB
  subgraph Infrastructure
    direction TB
    HTTP["HTTP — PRController, routes, middleware"]
    Loaders["Loaders — JiraTicket, GitDiff, WebCrawler"]
    LLMAdapters["LLM — CursorChatModel, BedrockChatModel"]
    VSAdapters["Vector stores — InMemory, Pinecone"]
    Mem["ConversationMemoryStore"]
    Emb["Embeddings factory"]
  end

  subgraph Application
    direction TB
    GenUC[GeneratePRDescription]
    RefUC[RefinePRDescription]
    IngUC[IngestDocuments]
    Chains2["Chains — prGeneration, refine, parentDocumentRetriever"]
    Schema["prDraftSchema — Zod + StructuredOutputParser"]
    DTOs[DTOs]
  end

  subgraph Domain
    direction TB
    PRDraft[PRDraft entity]
    Ports["Ports — LLMProvider, VectorStoreRepository, DocumentLoaderPort"]
    Errors[Domain errors]
  end

  HTTP --> GenUC & RefUC & IngUC
  GenUC & RefUC & IngUC --> Chains2
  Chains2 --> Schema
  GenUC & RefUC --> PRDraft
  GenUC & IngUC --> Ports
  Loaders & LLMAdapters & VSAdapters --> Ports
  GenUC --> Mem
  RefUC --> Mem
```

## API surface

```mermaid
flowchart LR
  subgraph Routes
    H[GET /health]
    I[POST /api/v1/documents/ingest]
    G[POST /api/v1/pr/generate]
    R[POST /api/v1/pr/refine]
    S[GET /api/v1/pr/sessions/:id]
  end

  H --> OK[Liveness]
  I --> IngUC2[IngestDocumentsUseCase]
  G --> GenUC2[GeneratePRDescriptionUseCase]
  R --> RefUC2[RefinePRDescriptionUseCase]
  S --> GetUC[GetPRSessionUseCase]
```

| Method | Path | Use case |
|--------|------|----------|
| `GET` | `/health` | Liveness |
| `POST` | `/api/v1/documents/ingest` | `IngestDocuments` |
| `POST` | `/api/v1/pr/generate` | `GeneratePRDescription` |
| `POST` | `/api/v1/pr/refine` | `RefinePRDescription` |
| `GET` | `/api/v1/pr/sessions/:id` | `GetPRSession` |

## Flow A — Document ingestion (index time)

Builds the RAG corpus from fixtures, Jira, URLs, or raw text. Child chunks are embedded and stored; parent documents are kept in memory for parent-document retrieval.

```mermaid
flowchart TB
  Req["POST /documents/ingest\n{ source, jiraKey?, url?, text? }"]
  Req --> Switch{source}

  Switch -->|fixture| Fix[Read fixture PR markdown]
  Switch -->|jira| JiraL[JiraTicketLoader]
  Switch -->|url| WebL[WebCrawlerLoader]
  Switch -->|text| Raw[Wrap raw text as parent doc]

  Fix & JiraL & WebL & Raw --> Parents[Parent documents]
  Parents --> Split["RecursiveCharacterTextSplitter\nchunk 512 / overlap 64"]
  Split --> Children[Child chunks + parentId metadata]
  Children --> Emb[Embeddings]
  Emb --> VS[(Vector store)]
  Parents --> MemParents[Parent doc registry in use case]

  VS --> Out["{ documentsAdded, totalDocuments }"]
```

## Flow B — PR generation (query time)

Loads live Jira + git diff, retrieves similar past PRs, runs an LCEL chain, and returns structured JSON plus a session id for refinement.

```mermaid
flowchart TB
  Req["POST /pr/generate\n{ jiraKey, branch?, diffPath?, repoPath? }"]

  subgraph Load["Parallel document load"]
    JiraL2[JiraTicketLoader]
    GitL[GitDiffLoader]
  end

  Req --> JiraL2 & GitL
  JiraL2 & GitL --> Split2[splitIntoParentChildDocuments]
  Split2 --> Query[Build similarity query from Jira key + excerpt]

  Query --> Retrieve[Vector store similaritySearch k=4]
  Retrieve --> Resolve["resolveParentDocuments\n(child hits → full parent PRs)"]
  Resolve --> Ctx[Retrieved context string]

  subgraph LCEL["prGenerationChain — RunnableSequence"]
    direction TB
    P[ChatPromptTemplate\nJira + diff + RAG context]
    M[LLM — Cursor or Bedrock]
    Z[StructuredOutputParser + prDraftSchema]
    P --> M --> Z
  end

  Ctx --> P
  JiraL2 & GitL --> P
  Z --> Draft[PRDraft entity]
  Draft --> Session[ConversationMemoryStore — new sessionId]
  Session --> Resp["201 { sessionId, draft }"]

  style LCEL fill:#f6f8fa,stroke:#333
```

**Output shape:** `title`, `summary`, `changes[]`, `testPlan`, `risks[]`, `jiraKey`, `metadata`.

## Flow C — PR refinement (multi-turn)

No vector retrieval; uses in-memory session draft + chat history.

```mermaid
sequenceDiagram
  participant C as Client
  participant API as PRController
  participant UC as RefinePRDescriptionUseCase
  participant Mem as ConversationMemoryStore
  participant Chain as refineChain LCEL
  participant LLM as Cursor / Bedrock

  C->>API: POST /pr/refine { sessionId, message }
  API->>UC: execute(dto)
  UC->>Mem: getSession(sessionId)
  Mem-->>UC: draft + chat history
  UC->>Chain: invoke(currentDraft, message, history)
  Chain->>LLM: prompt + format instructions
  LLM-->>Chain: JSON
  Chain-->>UC: parsed PRDraftSchema
  UC->>Mem: update draft + append messages
  UC-->>API: { sessionId, draft, history }
  API-->>C: 200 OK
```

## Parent-document retrieval

Small chunks improve search precision; full parent documents give the LLM complete PR context.

```mermaid
flowchart LR
  subgraph Index
    P[Parent PR doc] --> C1[Child chunk 1]
    P --> C2[Child chunk 2]
    P --> C3[Child chunk n]
    C1 & C2 & C3 --> VS2[(Vector index)]
  end

  subgraph Query
    Q[User query embedding] --> Search[Top-k child matches]
    Search --> Map[Map parentId → parent doc]
    Map --> Full[Full parent PRs in prompt]
  end

  VS2 --> Search
```

## Provider configuration

```mermaid
flowchart LR
  Env[".env / loadEnv()"]
  Env --> LLM{LLM_PROVIDER}
  Env --> VS3{PINECONE_API_KEY?}

  LLM -->|cursor| Cur[Cursor SDK]
  LLM -->|bedrock| Bed[AWS Bedrock]
  VS3 -->|set| Pine[PineconeVectorStoreAdapter]
  VS3 -->|unset| MemVS[InMemoryVectorStoreAdapter]

  Env --> Trace{LANGCHAIN_TRACING_V2}
  Trace -->|true| Smith[LangSmith traces]
```

## Source layout

```
src/
  domain/          # PRDraft, ports, domain errors
  application/     # Use cases, DTOs, LCEL chains, Zod schemas
  infrastructure/  # Express, loaders, LLM adapters, vector stores, memory
  shared/          # Config, logger
```
