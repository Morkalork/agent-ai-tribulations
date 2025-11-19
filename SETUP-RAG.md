# Setting Up RAG (Retrieval Augmented Generation)

This guide shows you how to set up RAG for dynamic context retrieval.

## Option 1: Using MemoryVectorStore (Simple, In-Memory)

**Good for:** Development, small datasets (< 1000 documents)

The `agent-with-rag.js` file uses `MemoryVectorStore` which stores vectors in memory. This is perfect for getting started!

### To use it:

1. **Update server.js** to import from `agent-with-rag.js` instead of `agent.js`:

```javascript
// Change this line in server.js:
import { runFAQAgent } from "./agent-with-rag.js";
```

2. **That's it!** The RAG version will:
   - Load FAQ data once
   - Create vector embeddings
   - On each question, retrieve only relevant context
   - Use less tokens = lower costs

## Option 2: Using Chroma (Persistent, Production-Ready)

**Good for:** Production, larger datasets, persistence across restarts

### Installation:

```bash
npm install chromadb
```

### Update agent-with-rag.js:

```javascript
import { Chroma } from "@langchain/community/vectorstores/chroma";

// Replace MemoryVectorStore with:
const vectorStore = await Chroma.fromDocuments(
  documents,
  embeddings,
  {
    collectionName: "faq-collection",
  }
);
```

## Option 3: Using PostgreSQL with pgvector

**Good for:** You already use PostgreSQL, want everything in one DB

### Installation:

```bash
npm install pg @langchain/community/vectorstores/pgvector
```

### Setup:

1. Enable pgvector extension in PostgreSQL
2. Create vector column
3. Use PGVector store

## Option 4: Using Pinecone (Cloud, Scalable)

**Good for:** Large scale, managed service, production

### Installation:

```bash
npm install @pinecone-database/pinecone @langchain/pinecone
```

### Setup:

1. Get API key from pinecone.io
2. Create index
3. Use Pinecone vector store

## Testing the RAG Version

Test it works:

```bash
# Test CLI version
node agent-with-rag.js "Who works at this company?"

# Or update server.js and test via web interface
npm start
```

## How It Works

1. **First Request**: 
   - Loads FAQ data
   - Creates vector embeddings (one-time cost)
   - Stores in vector store
   - Retrieves relevant docs for question

2. **Subsequent Requests**:
   - Uses cached vector store
   - Only retrieves relevant context
   - Much faster!

## Benefits

- ✅ **Saves Tokens**: Only sends relevant context (5-10 docs vs all data)
- ✅ **Better Accuracy**: Finds semantically similar content
- ✅ **Scales**: Works with thousands of documents
- ✅ **Dynamic**: Context changes based on question

## Monitoring

Watch for:
- Embedding costs (one-time per document)
- Retrieval quality (are the right docs found?)
- Token usage (should be lower than full context)

## Next Steps

1. Start with `agent-with-rag.js` (MemoryVectorStore)
2. When ready for production, switch to Chroma or Pinecone
3. Add caching for common questions
4. Monitor retrieval quality

