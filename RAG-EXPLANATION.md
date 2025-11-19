# Dynamic Context Building for Large Datasets

When your context is too large to fit in a prompt (or changes frequently), you need dynamic context retrieval. Here are the main approaches:

## 1. RAG (Retrieval Augmented Generation) ⭐ Most Common

**How it works:**

1. **Indexing Phase**: Convert all your documents/data into vector embeddings and store them
2. **Query Phase**:
   - Convert user question to embedding
   - Find similar documents using cosine similarity
   - Retrieve top N most relevant chunks
   - Inject only those chunks into the prompt

**Pros:**

- Finds semantically similar content (not just keyword matches)
- Only sends relevant context (saves tokens)
- Works great with large datasets

**Cons:**

- Requires embedding model (costs money)
- Need to store/manage vector database
- Slight latency for retrieval

**Tools:**

- LangChain vector stores (MemoryVectorStore, Chroma, Pinecone, Weaviate)
- Embeddings: OpenAI, Cohere, HuggingFace

## 2. Database Query Approach

**How it works:**

1. Extract keywords/intent from question
2. Query your database (SQL/NoSQL) with filters
3. Build context from query results
4. Inject into prompt

**Pros:**

- Fast (if DB is indexed)
- Uses existing database infrastructure
- Can use complex queries/filters

**Cons:**

- Only finds exact/keyword matches
- Requires good query logic
- May miss semantically similar content

**Example:**

```javascript
// Extract intent
const intent = extractIntent(question); // "employees", "mission", etc.

// Query database
const results = await db.query(
  `
  SELECT * FROM faq_items 
  WHERE category = $1 
  AND content ILIKE $2
  LIMIT 5
`,
  [intent.category, `%${intent.keywords}%`]
);
```

## 3. Hybrid Search

**How it works:**

- Combine keyword search (fast) + semantic search (accurate)
- Rank and merge results
- Use top results for context

**Pros:**

- Best of both worlds
- Fast AND accurate

**Cons:**

- More complex to implement
- Two queries = more latency

## 4. Caching + Incremental Updates

**How it works:**

- Cache frequently asked questions
- Only retrieve new context when needed
- Update cache incrementally

**Pros:**

- Very fast for common questions
- Reduces API costs

**Cons:**

- Need cache invalidation strategy
- More complex architecture

## Implementation Patterns

### Pattern 1: Pre-computed Vector Store (Recommended for Production)

```javascript
// One-time setup: Index all documents
const vectorStore = await createVectorStore(allDocuments);

// Per request: Retrieve relevant chunks
const relevantDocs = await vectorStore.similaritySearch(question, (k = 5));
const context = buildContext(relevantDocs);
```

### Pattern 2: Database with Full-Text Search

```javascript
// PostgreSQL example
const results = await db.query(
  `
  SELECT *, 
    ts_rank(to_tsvector('english', content), query) as rank
  FROM faq_items, 
    to_tsquery('english', $1) query
  WHERE to_tsvector('english', content) @@ query
  ORDER BY rank DESC
  LIMIT 5
`,
  [question]
);
```

### Pattern 3: Tool-Based Retrieval

```javascript
// Give agent a tool to search database
const searchTool = tool(
  async ({ query }) => {
    return await searchDatabase(query);
  },
  {
    name: "search_knowledge_base",
    description: "Search company knowledge base",
    schema: z.object({ query: z.string() }),
  }
);

const agent = createAgent({
  model: llm,
  tools: [searchTool], // Agent decides when to search
});
```

## Real-World Architecture

```
User Question
    ↓
[Intent Extraction] → Keywords, Categories, Entities
    ↓
[Retrieval Layer]
    ├─→ Vector Store (semantic search)
    ├─→ Database (keyword/exact match)
    └─→ Cache (frequent questions)
    ↓
[Context Builder] → Rank, deduplicate, format
    ↓
[LLM] → Generate answer with retrieved context
```

## Recommendations

**For your use case (company FAQ):**

1. **Start Simple**: Use database queries with categories/keywords
2. **Scale Up**: Add vector search when you have 100+ FAQ items
3. **Hybrid**: Combine both for best results
4. **Cache**: Cache common questions to save costs

**Production Checklist:**

- [ ] Use persistent vector store (not in-memory)
- [ ] Implement caching layer
- [ ] Add monitoring for retrieval quality
- [ ] Set up incremental updates (don't re-index everything)
- [ ] Add fallback if retrieval fails
- [ ] Monitor token usage (retrieved context size)
