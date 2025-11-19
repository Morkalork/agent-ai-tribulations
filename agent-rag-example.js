/**
 * RAG (Retrieval Augmented Generation) Example
 *
 * This shows how to handle large, dynamic contexts from databases
 * using vector embeddings and semantic search.
 */

import { createAgent } from "langchain";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * APPROACH 1: RAG with Vector Store (Most Common)
 *
 * Steps:
 * 1. Store documents in a vector database (embeddings)
 * 2. When question comes in, convert it to an embedding
 * 3. Find similar documents using vector similarity search
 * 4. Inject only the relevant context into the prompt
 */

async function runRAGAgent(question) {
  const llm = new ChatOpenAI({ apiKey: process.env.OPEN_API_KEY });
  const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPEN_API_KEY });

  // STEP 1: Load data from database/file (this would be your DB query)
  const faqData = await loadDataFromDatabase(); // Simulated DB call

  // STEP 2: Convert documents to vector embeddings and store them
  // In production, you'd do this once and persist the vector store
  const documents = createDocumentsFromData(faqData);
  const vectorStore = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  // STEP 3: Retrieve relevant context based on the question
  // This finds the most similar documents to the question
  const relevantDocs = await vectorStore.similaritySearch(question, 3); // Get top 3 matches

  // STEP 4: Build context from retrieved documents
  const context = relevantDocs
    .map((doc, i) => `[Context ${i + 1}]\n${doc.pageContent}`)
    .join("\n\n");

  // STEP 5: Create system prompt with ONLY relevant context
  const systemPrompt = `You are a helpful assistant for The Tribe.
  
Use the following context to answer the question. If the context doesn't contain 
enough information to answer, say so.

Context:
${context}

Answer the question based on the context provided. Be concise and accurate.`;

  const agent = createAgent({
    model: llm,
    tools: [],
    systemPrompt: systemPrompt,
  });

  const response = await agent.invoke({
    messages: [{ role: "user", content: question }],
  });

  if (response.messages && response.messages.length > 0) {
    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage.content || lastMessage.text || String(lastMessage);
  }

  return "I couldn't generate a response.";
}

/**
 * APPROACH 2: Database Query with Filters
 *
 * Query your database directly based on keywords/categories
 */
async function runDatabaseQueryAgent(question) {
  const llm = new ChatOpenAI({ apiKey: process.env.OPEN_API_KEY });

  // Extract keywords or intent from question
  const keywords = extractKeywords(question);

  // Query database for relevant records
  const relevantData = await queryDatabase({
    keywords: keywords,
    categories: extractCategories(question),
    limit: 5,
  });

  // Build context from database results
  const context = buildContextFromDBResults(relevantData);

  const systemPrompt = `You are a helpful assistant. Use this information:
${context}`;

  const agent = createAgent({
    model: llm,
    tools: [],
    systemPrompt: systemPrompt,
  });

  const response = await agent.invoke({
    messages: [{ role: "user", content: question }],
  });

  return extractAnswer(response);
}

/**
 * APPROACH 3: Hybrid Search (Keyword + Semantic)
 *
 * Combine traditional database queries with vector search
 */
async function runHybridSearchAgent(question) {
  const llm = new ChatOpenAI({ apiKey: process.env.OPEN_API_KEY });
  const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPEN_API_KEY });

  // 1. Keyword search in database (fast, exact matches)
  const keywordResults = await queryDatabaseByKeywords(question);

  // 2. Semantic search with vectors (slower, but finds similar meaning)
  const semanticResults = await vectorSearch(question, embeddings);

  // 3. Combine and deduplicate results
  const combinedResults = mergeAndRankResults(keywordResults, semanticResults);

  // 4. Build context from top results
  const context = buildContext(combinedResults.slice(0, 5));

  const systemPrompt = `Answer based on: ${context}`;

  // ... rest of agent setup
}

// Helper functions

function createDocumentsFromData(data) {
  const documents = [];

  // Create documents from different sections
  // Each document becomes a searchable chunk
  documents.push(
    new Document({
      pageContent: `Company: ${data.en.companyName}\nFounder: ${data.en.founder}\nTagline: ${data.en.tagline}\nStory: ${data.en.story}`,
      metadata: { type: "company_info", source: "faq.json" },
    })
  );

  // Each employee as a separate document
  data.en.employees.forEach((emp) => {
    documents.push(
      new Document({
        pageContent: `Employee: ${emp.name}\nRole: ${emp.role}\nFocus: ${emp.inclination}`,
        metadata: { type: "employee", name: emp.name, source: "faq.json" },
      })
    );
  });

  // Mission areas as documents
  data.en.mission.forEach((mission) => {
    documents.push(
      new Document({
        pageContent: `${mission.title}: ${
          mission.text
        }\nTechnologies: ${mission.items.join(", ")}`,
        metadata: {
          type: "mission",
          category: mission.title,
          source: "faq.json",
        },
      })
    );
  });

  return documents;
}

// Simulated database functions (replace with real DB queries)

async function loadDataFromDatabase() {
  // In production: const data = await db.query("SELECT * FROM faq_data");
  const fs = await import("fs");
  return JSON.parse(fs.readFileSync("faq.json", "utf8"));
}

function extractKeywords(question) {
  // Simple keyword extraction (in production, use NLP libraries)
  const stopWords = [
    "the",
    "a",
    "an",
    "is",
    "are",
    "what",
    "who",
    "where",
    "when",
    "why",
    "how",
  ];
  return question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word));
}

function extractCategories(question) {
  // Extract categories based on keywords
  const categories = [];
  if (
    question.toLowerCase().includes("employee") ||
    question.toLowerCase().includes("who")
  ) {
    categories.push("employees");
  }
  if (
    question.toLowerCase().includes("mission") ||
    question.toLowerCase().includes("what")
  ) {
    categories.push("mission");
  }
  return categories;
}

async function queryDatabase({ keywords, categories, limit }) {
  // Simulated: SELECT * FROM faq WHERE category IN (...) AND content LIKE '%keyword%' LIMIT ?
  // In production, use your actual database (PostgreSQL, MongoDB, etc.)
  return [];
}

function buildContextFromDBResults(results) {
  return results.map((r) => `${r.title}: ${r.content}`).join("\n");
}

function extractAnswer(response) {
  if (response.messages && response.messages.length > 0) {
    const lastMessage = response.messages[response.messages.length - 1];
    return lastMessage.content || lastMessage.text || String(lastMessage);
  }
  return "No answer generated.";
}

export { runRAGAgent, runDatabaseQueryAgent, runHybridSearchAgent };
