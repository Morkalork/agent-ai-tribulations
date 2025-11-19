/**
 * Quick test script to verify RAG setup works
 */

import { runFAQAgent } from "./agent-with-rag.js";
import * as dotenv from "dotenv";

dotenv.config();

async function test() {
  console.log("Testing RAG implementation...\n");

  const questions = [
    "Who works at this company?",
    "What is the company's mission?",
    "What technologies does the company use?",
    "How can I contact the company?",
  ];

  for (const question of questions) {
    console.log(`\n📝 Question: ${question}`);
    console.log("⏳ Processing...");
    
    try {
      const start = Date.now();
      const answer = await runFAQAgent(question);
      const duration = Date.now() - start;
      
      console.log(`✅ Answer (${duration}ms):`);
      console.log(answer.substring(0, 200) + (answer.length > 200 ? "..." : ""));
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }

  console.log("\n✨ Test complete!");
}

test().catch(console.error);

