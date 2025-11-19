/**
 * Practical RAG Implementation
 *
 * This version retrieves only relevant context instead of loading everything.
 * Replace agent.js with this when you have larger datasets.
 */

import { createAgent } from "langchain";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// Cache the vector store (in production, use a persistent store)
let vectorStoreCache = null;
let faqDataCache = null;

/**
 * Initialize vector store from FAQ data
 * In production, this would load from a database and be cached/persisted
 */
async function initializeVectorStore() {
  if (vectorStoreCache) {
    return vectorStoreCache;
  }

  // Load data (replace with DB query in production)
  const faqData = JSON.parse(fs.readFileSync("faq.json", "utf8"));
  faqDataCache = faqData;

  const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPEN_API_KEY });

  // Create documents from FAQ data
  const documents = [];

  // Company info document
  documents.push(
    new Document({
      pageContent: `Company Name: ${faqData.en.companyName}
Founder: ${faqData.en.founder}
Co-founders: ${faqData.en["co-founders"].join(", ")}
Mission Statement: ${faqData.en.missionStatement}
Tagline: ${faqData.en.tagline}
Story: ${faqData.en.story}`,
      metadata: { type: "company_info" },
    })
  );

  // Each employee as a document
  faqData.en.employees.forEach((emp) => {
    documents.push(
      new Document({
        pageContent: `Employee: ${emp.name}
Role: ${emp.role}
Area: ${emp.area}`,
        metadata: { type: "employee", name: emp.name },
      })
    );
  });

  // Mission areas as documents
  faqData.en.mission.forEach((mission) => {
    documents.push(
      new Document({
        pageContent: `${mission.title}
${mission.text}
Technologies: ${mission.items.join(", ")}`,
        metadata: { type: "mission", category: mission.title },
      })
    );
  });

  // Contact info
  documents.push(
    new Document({
      pageContent: `Contact Information:
Email: ${faqData.en.contact.email}
Phone: ${faqData.en.contact.phone}
Address: ${faqData.en.hq.address}`,
      metadata: { type: "contact" },
    })
  );

  // Create vector store
  vectorStoreCache = await MemoryVectorStore.fromDocuments(
    documents,
    embeddings
  );

  return vectorStoreCache;
}

/**
 * Run FAQ agent with RAG - only retrieves relevant context
 */
async function runFAQAgent(question) {
  const llm = new ChatOpenAI({ apiKey: process.env.OPEN_API_KEY });

  // Initialize vector store (cached after first call)
  const vectorStore = await initializeVectorStore();

  // Retrieve relevant documents based on question similarity
  // k=5 means get top 5 most similar documents
  const relevantDocs = await vectorStore.similaritySearch(question, 5);

  // Build context from retrieved documents only
  const context = relevantDocs
    .map((doc, i) => {
      const metadata = doc.metadata.type ? `[${doc.metadata.type}]` : "";
      return `${metadata}\n${doc.pageContent}`;
    })
    .join("\n\n---\n\n");

  // Create system prompt with ONLY relevant context
  const systemPrompt = `You are a helpful assistant for ${faqDataCache.en.companyName}.

Use the following context to answer questions. If the context doesn't contain enough 
information to fully answer the question, provide the best answer you can based on 
what's available.

Context:
${context}

Answer questions about the company based on this context. Be helpful and accurate.`;

  const agent = createAgent({
    model: llm,
    tools: [],
    systemPrompt: systemPrompt,
  });

  const response = await agent.invoke({
    messages: [{ role: "user", content: question }],
  });

  // Extract the answer from the response
  if (response.messages && response.messages.length > 0) {
    const lastMessage = response.messages[response.messages.length - 1];
    const answer =
      lastMessage.content || lastMessage.text || String(lastMessage);
    return answer;
  } else {
    return JSON.stringify(response, null, 2);
  }
}

// Export for use in server
export { runFAQAgent };

// CLI mode: if run directly (not imported), accept command-line arguments
if (process.argv[1] && process.argv[1].endsWith("agent-with-rag.js")) {
  const question = process.argv.slice(2).join(" ");

  if (!question) {
    console.error("Usage: node agent-with-rag.js <question>");
    console.error(
      'Example: node agent-with-rag.js "What is the company\'s mission?"'
    );
    process.exit(1);
  }

  runFAQAgent(question)
    .then((answer) => console.log(answer))
    .catch((error) => {
      console.error("Error:", error.message);
      process.exit(1);
    });
}
