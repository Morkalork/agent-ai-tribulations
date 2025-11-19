/**
 * Simple RAG Implementation (No Vector Store Required)
 * 
 * This version uses keyword-based search instead of vector embeddings.
 * Perfect for getting started without additional dependencies.
 */

import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

// Cache the FAQ data
let faqDataCache = null;

/**
 * Simple keyword-based search - finds documents containing question keywords
 */
function findRelevantDocuments(question, documents) {
  const questionLower = question.toLowerCase();
  const questionWords = questionLower
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !["the", "a", "an", "is", "are", "what", "who", "where", "when", "why", "how", "does", "do", "can", "could"].includes(word));

  // Score each document based on keyword matches
  const scoredDocs = documents.map(doc => {
    const contentLower = doc.content.toLowerCase();
    let score = 0;
    
    questionWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1;
      }
    });
    
    return { ...doc, score };
  });

  // Sort by score and return top matches
  return scoredDocs
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 matches
}

/**
 * Create searchable documents from FAQ data
 */
function createDocumentsFromData(data) {
  const documents = [];

  // Company info document
  documents.push({
    content: `Company Name: ${data.en.companyName}
Founder: ${data.en.founder}
Co-founders: ${data.en["co-founders"].join(", ")}
Mission Statement: ${data.en.missionStatement}
Tagline: ${data.en.tagline}
Story: ${data.en.story}`,
    type: "company_info"
  });

  // Each employee as a document
  data.en.employees.forEach((emp) => {
    documents.push({
      content: `Employee: ${emp.name}
Role: ${emp.role}
Area: ${emp.area}`,
      type: "employee",
      name: emp.name
    });
  });

  // Mission areas as documents
  data.en.mission.forEach((mission) => {
    documents.push({
      content: `${mission.title}
${mission.text}
Technologies: ${mission.items.join(", ")}`,
      type: "mission",
      category: mission.title
    });
  });

  // Contact info
  documents.push({
    content: `Contact Information:
Email: ${data.en.contact.email}
Phone: ${data.en.contact.phone}
Address: ${data.en.hq.address}`,
    type: "contact"
  });

  return documents;
}

/**
 * Run FAQ agent with simple keyword-based RAG
 */
async function runFAQAgent(question) {
  const llm = new ChatOpenAI({ apiKey: process.env.OPEN_API_KEY });

  // Load data (replace with DB query in production)
  if (!faqDataCache) {
    faqDataCache = JSON.parse(fs.readFileSync("faq.json", "utf8"));
  }

  // Create searchable documents
  const documents = createDocumentsFromData(faqDataCache);

  // Find relevant documents using keyword search
  const relevantDocs = findRelevantDocuments(question, documents);

  // Build context from retrieved documents
  const context = relevantDocs.length > 0
    ? relevantDocs
        .map((doc, i) => {
          const metadata = doc.type ? `[${doc.type}]` : "";
          return `${metadata}\n${doc.content}`;
        })
        .join("\n\n---\n\n")
    : // Fallback: if no matches, include company info
      `Company: ${faqDataCache.en.companyName}\n${faqDataCache.en.missionStatement}`;

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
if (process.argv[1] && process.argv[1].endsWith("agent-simple-rag.js")) {
  const question = process.argv.slice(2).join(" ");

  if (!question) {
    console.error("Usage: node agent-simple-rag.js <question>");
    console.error(
      'Example: node agent-simple-rag.js "What is the company\'s mission?"'
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

